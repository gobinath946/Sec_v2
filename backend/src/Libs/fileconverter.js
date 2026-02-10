const libre = require('libreoffice-convert');
const { JSDOM } = require('jsdom');
const AdmZip = require('adm-zip');
const path = require('path');
const crypto = require('crypto');
const { DOMParser } = require('@xmldom/xmldom');


async function convertDocxBufferToTextBuffer(docxBuffer) {
    try {
        return new Promise((resolve, reject) => {
            libre.convert(docxBuffer, '.txt', undefined, (err, done) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(done);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

async function convertDocxBufferToPdfBuffer(docxBuffer) {
    try {
        return new Promise((resolve, reject) => {
            libre.convert(docxBuffer, '.pdf', undefined, (err, done) => {
                if (err) {
                    console.error('Error converting DOCX to PDF:', err);
                    reject(err);
                } else {
                    console.log('Conversion to PDF complete.');
                    resolve(done);
                }
            });
        });
    } catch (error) {
        console.error('Error converting DOCX to PDF:', error);
        throw error;
    }
}

const convertDocxBufferToHtmlBuffer = async (docxBuffer) => {
    return new Promise((resolve, reject) => {
        libre.convert(docxBuffer, '.html', undefined, (err, htmlBuffer) => {
            if (err) {
                console.error('Error converting DOCX to HTML:', err);
                reject(err);
            } else {
                console.log('Conversion to HTML complete.');
                resolve(htmlBuffer);
            }
        });
    });
};


const extractImagesAndRelationships = async (docxBuffer) => {
    const zip = new AdmZip(docxBuffer);
    const zipEntries = zip.getEntries();
    const imageMap = {};
    const relationshipMap = {};

    zipEntries.forEach((entry) => {
        if (entry.entryName.match(/word\/media\/image\d+\.(png|jpeg|jpg|gif)$/i)) {
            const imageBuffer = entry.getData();
            const base64Image = `data:image/${path.extname(entry.entryName).substring(1)};base64,${imageBuffer.toString('base64')}`;
            imageMap[entry.entryName] = base64Image;
        }
    });

    const relsEntry = zipEntries.find((entry) => entry.entryName === 'word/_rels/document.xml.rels');
    if (relsEntry) {
        const relsXml = relsEntry.getData().toString('utf8');
        const doc = new DOMParser().parseFromString(relsXml, 'application/xml');
        const relationships = doc.getElementsByTagName('Relationship');

        Array.from(relationships).forEach((rel) => {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (target.match(/^media\/image\d+\.(png|jpeg|jpg|gif)$/i)) {
                relationshipMap[id] = `word/${target}`;
            }
        });
    } else {
        console.error('No document.xml.rels entry found');
    }


    return { imageMap, relationshipMap };
};


const parseDocumentXml = async (documentXml, imageMap, relationshipMap) => {
    const doc = new DOMParser().parseFromString(documentXml, 'application/xml');
    const blipNodes = doc.getElementsByTagName('a:blip');
    const imageRefs = {};

    Array.from(blipNodes).forEach((blip) => {
        const embedId = blip.getAttribute('r:embed');
        const imageSrc = relationshipMap[embedId];
        if (imageSrc) {
            const blipParent = blip.parentNode.parentNode.parentNode;
            const ext = blipParent.getElementsByTagName('a:ext')[0];
            const cx = ext.getAttribute('cx');
            const cy = ext.getAttribute('cy');
            const posH = blipParent.getElementsByTagName('a:off')[0].getAttribute('x');
            const posV = blipParent.getElementsByTagName('a:off')[0].getAttribute('y');
            
            imageRefs[embedId] = {
                src: imageMap[imageSrc],
                style: `position:absolute; left:${posH / 12700}px; top:${posV / 12700}px; width:${cx / 12700}px; height:${cy / 12700}px;`
            };
        }
    });

    return imageRefs;
};


const embedImagesAsBase64 = async (docxBuffer, htmlBuffer) => {
    const { imageMap, relationshipMap } = await extractImagesAndRelationships(docxBuffer);

    const zip = new AdmZip(docxBuffer);
    const documentXml = zip.readAsText('word/document.xml');
    const imageRefs = await parseDocumentXml(documentXml, imageMap, relationshipMap);

    const dom = new JSDOM(htmlBuffer.toString());
    const images = dom.window.document.querySelectorAll('img');

    images.forEach((img) => {
        const embedId = img.getAttribute('data-embed-id');
        if (embedId && imageRefs[embedId]) {
            img.setAttribute('src', imageRefs[embedId].src);
            img.setAttribute('style', imageRefs[embedId].style);
        }
    });

    return Buffer.from(dom.serialize());
};



module.exports = {
    convertDocxBufferToTextBuffer:convertDocxBufferToTextBuffer,
    convertDocxBufferToPdfBuffer:convertDocxBufferToPdfBuffer,
    convertDocxBufferToHtmlBuffer:convertDocxBufferToHtmlBuffer,
    embedImagesAsBase64:embedImagesAsBase64,
};
