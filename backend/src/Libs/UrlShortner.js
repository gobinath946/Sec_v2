const axios = require("axios");
const config = require("../../config/environment/dbDependencies");

async function generateShortURL(api_keys, signature, original_url) {
  const { api_key, api_secret } = api_keys[0];
  const url = `${config.ApplnxUrlCreation}?api_key=${api_key}&api_secret=${api_secret}&unique_signature=${signature}&url=${original_url}`;
  try {
    const response = await axios.post(url);
    return response.data.data.link;
  } catch (error) {
    throw new Error(`Failed to generate short URL: ${error.message}`);
  }
}

module.exports = generateShortURL;
