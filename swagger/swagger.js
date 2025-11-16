const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

module.exports = function (app) {
  const filePath = path.join(__dirname, 'swagger.yaml');
  const swaggerDocument = yaml.load(filePath);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
