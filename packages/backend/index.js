require('dotenv').config({ path: '.env.local' }); // for development only

const express = require('express');
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');
const http = require('http');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 4006;

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'portal', 'dist')));
app.use('/colabora', express.static(path.join(__dirname, '..', 'front', 'dist')));
app.use('/colabora/(*)?', express.static(path.join(__dirname, '..', 'front', 'dist')));
app.use('/scripts', express.static(path.join(__dirname, '..', '..', 'scripts_test','scripts.js')));

const server = http.createServer(app);

// const specs = swaggerJsdoc(require('./services/swagger_options'));

// app.get('/openapi', function (_, res) {
//   res.send(specs);
// });

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

app.use(require('./services/routes'));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'portal', 'dist', 'index.html'));
});

server.listen({ port }, () => {
  console.log(`MEA API Server is running on port ${port}`);
});

/* process.on("SIGINT", async () => {
    console.log("\nBye");

    process.exit(0);
}); */

/* TODO: Se eu subo esta declaracao (linha abaixo), tenho erro pq? */
const { Messagery } = require('dorothy-dna-services');
Messagery.initSocket(server);

require('./scheduler')(port);
require('./courier')(process.env.DATABASE_URL);
