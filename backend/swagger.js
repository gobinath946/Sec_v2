const swaggerAutogen = require('swagger-autogen')();

const doc = {
 info: {
  title: 'Secure Gateway',
  description: 'Description'
 },
 host: 'localhost:8083'
};

const outputFile = './swagger-output.json';
const routes = ['./index.js'];
swaggerAutogen(outputFile, routes, doc);