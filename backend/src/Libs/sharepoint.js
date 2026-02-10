const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');
const fetch = require('node-fetch');

class SharePointService {
    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.initializeClient();
    }

    validateConfig(config) {
        const requiredParams = ['tenantId', 'clientId', 'clientSecret', 'siteId', 'driveId'];
        const missingParams = requiredParams.filter(param => !config[param]);

        if (missingParams.length > 0) {
            throw new Error(`Missing required SharePoint configuration parameters: ${missingParams.join(', ')}`);
        }
    }

    async initializeClient() {
        try {
            const credential = new ClientSecretCredential(
                this.config.tenantId,
                this.config.clientId,
                this.config.clientSecret
            );

            const authProvider = new TokenCredentialAuthenticationProvider(credential, {
                scopes: ['https://graph.microsoft.com/.default']
            });

            this.graphClient = Client.initWithMiddleware({
                authProvider,
                defaultVersion: 'v1.0'
            });

            // Verify connection
            await this.verifyConnection();

        } catch (error) {
            console.error('SharePoint initialization error:', error);
            throw new Error(`Failed to initialize SharePoint client: ${error.message}`);
        }
    }

    async verifyConnection() {
        try {
            await this.graphClient
                .api(`/sites/${this.config.siteId}`)
                .get();
        } catch (error) {
            throw new Error(`Failed to verify SharePoint connection: ${error.message}`);
        }
    }

    async ensureFolderPath(folderPath) {
        const folderStructure = folderPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const folder of folderStructure) {
            currentPath += `/${folder}`;
            try {
                // Try to get the folder first
                await this.graphClient
                    .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${currentPath}`)
                    .get();
            } catch (error) {
                if (error.statusCode === 404) {
                    try {
                        // Create folder using the correct API approach
                        const folderData = {
                            name: folder,
                            folder: {},
                            "@microsoft.graph.conflictBehavior": "replace"
                        };

                        // If it's the first folder in the path, create it at root
                        const parentPath = currentPath.split('/').slice(0, -1).join('/');
                        const endpoint = parentPath
                            ? `/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${parentPath}:/children`
                            : `/sites/${this.config.siteId}/drives/${this.config.driveId}/root/children`;

                        await this.graphClient
                            .api(endpoint)
                            .post(folderData);
                    } catch (createError) {
                        throw new Error(`Failed to create folder ${currentPath}: ${createError.message}`);
                    }
                } else {
                    throw new Error(`Error accessing folder ${currentPath}: ${error.message}`);
                }
            }
        }
    }

    async uploadFile({ fileBuffer, fileName, folderPath, versioning = true }) {
        try {
            // Ensure proper buffer
            const buffer = Buffer.isBuffer(fileBuffer)
                ? fileBuffer
                : Buffer.from(fileBuffer, 'base64');

            // Ensure folder exists
            await this.ensureFolderPath(folderPath);

            // Handle versioning
            const finalFileName = versioning
                ? await this.getNextVersionFileName(folderPath, fileName)
                : fileName;

            // Upload file
            const uploadResponse = await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${folderPath}/${finalFileName}:/content`)
                .put(buffer);

            // Generate shareable link
            const permission = await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/items/${uploadResponse.id}/createLink`)
                .post({
                    type: 'view',
                    scope: 'organization'
                });

            return {
                success: true,
                fileName: finalFileName,
                fileId: uploadResponse.id,
                webUrl: permission.link.webUrl,
                folderPath,
                size: uploadResponse.size,
                createdDateTime: uploadResponse.createdDateTime,
                lastModifiedDateTime: uploadResponse.lastModifiedDateTime
            };

        } catch (error) {
            console.error('SharePoint upload error:', error);
            throw new Error(`Failed to upload file to SharePoint: ${error.message}`);
        }
    }

    async getNextVersionFileName(folderPath, fileName) {
        try {
            // Fetch all files in the folder
            const files = await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${folderPath}:/children`)
                .get();
    
            let maxVersion = 0;
            const fileBaseName = fileName.split('.')[0];
            const fileExtension = fileName.split('.').pop();
    
            // Loop through the files and match by both base name and file type
            files.value.forEach(file => {
                // Extract file extension to compare the type
                const currentFileExtension = file.name.split('.').pop();
                if (file.name.startsWith(fileBaseName) && currentFileExtension === fileExtension) {
                    // Match the version pattern like _v1, _v2, etc.
                    const versionMatch = file.name.match(/_v(\d+)/);
                    if (versionMatch) {
                        const version = parseInt(versionMatch[1]);
                        maxVersion = Math.max(maxVersion, version);
                    }
                }
            });
    
            // Return the new versioned file name
            return `${fileBaseName}_v${maxVersion + 1}.${fileExtension}`;
        } catch (error) {
            console.error('Error fetching files or determining version:', error);
            // If an error occurs, return the file with _v1 version as a fallback
            return `${fileBaseName}_v1.${fileExtension}`;
        }
    }
    

    async deleteFile(folderPath, fileName) {
        try {
            await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${folderPath}/${fileName}`)
                .delete();
            return true;
        } catch (error) {
            console.error('SharePoint delete error:', error);
            throw new Error(`Failed to delete file from SharePoint: ${error.message}`);
        }
    }

    async downloadFileAlt(filePath) {
        try {
            // First get the file metadata and download URL
            const response = await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/root:${filePath}`)
                .get();

            // Get download URL
            const downloadUrl = await this.graphClient
                .api(`/sites/${this.config.siteId}/drives/${this.config.driveId}/items/${response.id}`)
                .select('@microsoft.graph.downloadUrl')
                .get();

            // Download the file using the download URL
            const fileResponse = await fetch(downloadUrl['@microsoft.graph.downloadUrl']);

            // Convert to Buffer
            const fileBuffer = await fileResponse.buffer();

            return {
                success: true,
                fileBuffer,
                fileName: response.name,
                fileSize: response.size,
                lastModified: response.lastModifiedDateTime
            };

        } catch (error) {
            console.error('SharePoint download error:', error);
            throw new Error(`Failed to download file from SharePoint: ${error.message}`);
        }
    }
}

module.exports = SharePointService;