// Vite uses import.meta.env instead of process.env
// Environment variables must be prefixed with VITE_

let BASE_URL;
let URL;

// Get server environment from VITE_SERVER_ENV or default to 'LOCAL'
const server = import.meta.env.VITE_SERVER_ENV || 'LOCAL';

// Frontend URL String
if (server === 'PROD') {
  URL = 'https://app.securegateway.io/messagedetail/{%action%}/{%template%}/{%uid%}';
} 
else if (server === 'UAT') {
  URL = 'https://uat.securegateway.io/messagedetail/{%action%}/{%template%}/{%uid%}';
}
else if (server === 'LOCAL') {
  URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000/messagedetail/{%action%}/{%template%}/{%uid%}';
} 
else if (server === 'TEST') {
  URL = 'https://dev.securegateway.io/messagedetail/{%action%}/{%template%}/{%uid%}';
} 
else {
  URL = 'https://dev-upkeep.securegateway.io/messagedetail/{%action%}/{%template%}/{%uid%}';
}

// Backend Connectivity
if (server === 'PROD') {
  BASE_URL = 'https://app-backend.securegateway.io';
} 
else if (server === 'UAT') {
  BASE_URL = 'https://uat-backend.securegateway.io';
}
else if (server === 'LOCAL') {
  BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';
} 
else if (server === 'TEST') {
  BASE_URL = 'https://dev-backend.securegateway.io';
} 
else {
  BASE_URL = 'https://app-backend.securegateway.io';
}

export { BASE_URL, URL };
