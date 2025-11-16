const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Event Booking API',
    version: '1.0.0',
    description: 'API documentation for the Event Booking System',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local server'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, 'swagger.yaml')
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
