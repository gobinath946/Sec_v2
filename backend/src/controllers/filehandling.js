const Message = require('../models/model').Message;
const Customer = require('../models/model').Customer;
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { refreshDropboxAccessToken } = require('../Libs/cron');
const { Dropbox } = require('dropbox');
const { google } = require('googleapis');
const stream = require('stream');
const config = require("../../config/environment/dbDependencies");




const updateFiles = async (req, res) => {
    const uid = req.params.uid;
    const { action, service } = req.body;

    if (!uid || uid.trim() === '') {
        return res.status(400).json({ message: 'uid is required' });
    }
    if (!action) {
        return res.status(400).json({ error: 'Action is required' });
    }
    if (!service) {
        return res.status(400).json({ error: 'Service is required' });
    }
    let message = await Message.findOne({ uid: uid, expired: false });
    if (!message) {
        return res.status(404).json({ message: 'Message not found' });
    }
    const customer = await Customer.findOne({ uid: message.customer_id });
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const config_data = customer.get("file_configuration")
    const recipient_id = message.get("recipient_externalid")
    const message_id = message.get("message_externalid")
    const recipient_name = message.get("recipient_name")

    if (!recipient_id) {
        return res.status(400).json({ error: 'Recipient Id is required' });
    }

    if (!Array.isArray(config_data) || config_data === 0) {
        return res.status(400).json({ error: 'No file configuration found for this user' });
    }
    const fileConfig = config_data.find(config => config.service_name === service);
    if (!fileConfig) {
        return res.status(400).json({ error: 'File configuration for the specified service not found' });
    }

    try {
        if (service === "S3") {
            const s3Client = new S3Client({
                region: fileConfig.region,
                credentials: {
                    accessKeyId: fileConfig.access_key,
                    secretAccessKey: fileConfig.secret_key
                }
            });

            const folderName = `user_${recipient_id}`;
            const files = req.files;
            const responseItems = [];

            for (const file of files) {
                const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/[^\w\s]/gi, '');
                const fieldName = file.fieldname;
                const originalName = file.originalname.split('.').slice(0, -1).join('.');
                const extension = file.originalname.split('.').pop();
                const fileName = `${fieldName}_${originalName}_${timestamp}.${extension}`;
                const fileContent = file.buffer;
                const uploadParams = {
                    Bucket: fileConfig.bucket_name,
                    Key: `${folderName}/${fileName}`,
                    Body: fileContent,
                    ContentType: file.mimetype
                };

                try {
                    const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
                    const s3Link = `https://${fileConfig.bucket_name}.s3.${fileConfig.region}.amazonaws.com/${folderName}/${fileName}`;

                    const newResponseItem = {
                        created_at: new Date(),
                        action: action,
                        data: fileName,
                        link: s3Link
                    };
                    responseItems.push(newResponseItem);
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    return res.status(500).json({ message: 'Error uploading file to S3' });
                }
            }
            const result = await Message.findOneAndUpdate(
                { uid: uid },
                {
                    $push: { response: { $each: responseItems } },
                    $set: { status: "Responded" },
                },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ error: 'Message not found' });
            }

            return res.json({ message: 'Response submitted successfully' });
        } else if (service === "Dropbox") {
            let folderId;
            const accessToken = fileConfig.access_key.trim();
            const dbx = new Dropbox({ accessToken: accessToken });

            const folderName = `${recipient_name}`;
            const files = req.files;
            const responseItems = [];

            try {
                const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folderName}`;
                const folderExistsResponse = await dbx.filesGetMetadata({ path: folderPath });
                folderId = folderExistsResponse.result.id;
                console.log('Folder already exists in Dropbox. Using existing folder.');
            } catch (error) {
                if (error.status === 409) {
                    console.log('Folder already exists in Dropbox. Using existing folder.');
                } else {
                    console.log('Access token expired. Refreshing access token.');
                    try {
                        await refreshDropboxAccessToken(customer);
                        return res.redirect(req.originalUrl);
                    } catch (refreshError) {
                        console.error('Error refreshing access token:', refreshError.message);
                        return res.status(500).json({ message: 'Error refreshing access token' });
                    }
                }
            }

            if (!folderId) {
                try {
                    const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folderName}`;
                    await dbx.filesCreateFolderV2({ path: folderPath });
                    const defaultFileName = `.${message_id}.sfdb`;
                    const defaultFileContent = 'Do Not Delete';
                    await dbx.filesUpload({ path: `${folderPath}/${defaultFileName}`, contents: defaultFileContent });
                } catch (error) {
                    console.error('Error creating folder or default file:', error);
                    return res.status(500).json({ message: 'Error creating folder or default file in Dropbox' });
                }
            }


            for (const file of files) {
                const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/[^\w\s]/gi, '');
                const fieldName = file.fieldname;
                const originalName = file.originalname.split('.').slice(0, -1).join('.');
                const extension = file.originalname.split('.').pop();
                const fileName = `${fieldName}_${originalName}_${timestamp}.${extension}`;
                const fileContent = file.buffer;

                try {

                    const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folderName}`;
                    const listResponse = await dbx.filesListFolder({ path: folderPath });
                    for (const entry of listResponse.result.entries) {
                        if (entry.name.startsWith(fieldName)) {
                            await dbx.filesDeleteV2({ path: entry.path_lower });
                        }
                    }

                    const uploadResponse = await dbx.filesUpload({ path: `${folderPath}/${fileName}`, contents: fileContent });
                    const dropboxLink = uploadResponse.result.path_display;

                    const newResponseItem = {
                        created_at: new Date(),
                        action: action,
                        data: fileName,
                        link: dropboxLink
                    };
                    responseItems.push(newResponseItem);
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    return res.status(500).json({ message: 'Error uploading file to Dropbox' });
                }
            }

            const result = await Message.findOneAndUpdate(
                { uid: uid },
                {
                    $push: { response: { $each: responseItems } },
                    $set: { status: "Responded" },
                },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ error: 'Message not found' });
            }

            return res.json({ message: 'Response submitted successfully' });
        }
        else if (service === "GoogleDrive") {
            const credentials = {
                clientId: fileConfig.client_id,
                clientSecret: fileConfig.secret_id,
                redirectUri: fileConfig.redirect_uri
            };
            const auth = new google.auth.OAuth2(credentials);

            auth.setCredentials({
                refresh_token: fileConfig.refresh_token
            });

            const drive = google.drive({ version: 'v3', auth });

            const folderName = `user_${recipient_id}`;
            const files = req.files;
            const responseItems = [];
            let folderId;
            
            try {
                const response = await drive.files.list({
                    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
                    fields: 'files(id)',
                });
                if (response.data.files.length > 0) {
                    folderId = response.data.files[0].id;
                } else {
                    const createFolderResponse = await drive.files.create({
                        requestBody: {
                            name: folderName,
                            mimeType: 'application/vnd.google-apps.folder'
                        }
                    });
                    folderId = createFolderResponse.data.id;
                }
            } catch (error) {
                console.error('Error finding/creating folder:', error);
                return res.status(500).json({ message: 'Error finding/creating folder in Google Drive' });
            }

            for (const file of files) {
                const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/[^\w\s]/gi, '');
                const fieldName = file.fieldname;
         
                const originalName = file.originalname.split('.').slice(0, -1).join('.');
                const extension = file.originalname.split('.').pop();
                const fileName = `${fieldName}_${originalName}_${timestamp}.${extension}`;
                const fileContent = file.buffer;
                const fileContentStream = new stream.PassThrough();
                fileContentStream.end(fileContent);

                try {
                    const response = await drive.files.create({
                        requestBody: {
                            name: fileName,
                            parents: [folderId]
                        },
                        media: {
                            mimeType: file.mimetype,
                            body: fileContentStream
                        }
                    });
                    const googleDriveLink = `https://drive.google.com/file/d/${response.data.id}/view`;
                    const newResponseItem = {
                        created_at: new Date(),
                        action: action,
                        data: fileName,
                        link: googleDriveLink
                    };
                    responseItems.push(newResponseItem);
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    return res.status(500).json({ message: 'Error uploading file to Google Drive' });
                }
            }

            const result = await Message.findOneAndUpdate(
                { uid: uid },
                {
                    $push: { response: { $each: responseItems } },
                    $set: { status: "Responded" },
                },
                { new: true }
            );
            if (!result) {
                return res.status(404).json({ error: 'Message not found' });
            }
            return res.json({ message: 'Response submitted successfully' });
        }
        else {
            return res.status(400).json({ error: 'Invalid service specified' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
    updateFiles: updateFiles,
};



