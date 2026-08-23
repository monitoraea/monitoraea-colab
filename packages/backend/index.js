require('dotenv').config({ path: '.env.local' }); // for development only

const express = require('express');
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');
const http = require('http');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 4006;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();

app.use(cors());

app.use(express.json({ limit: '10MB' }));

app.use(express.static(path.join(__dirname, '..', 'portal', 'dist')));
app.use('/colabora', express.static(path.join(__dirname, '..', 'front', 'dist')));
app.use('/colabora/(*)?', express.static(path.join(__dirname, '..', 'front', 'dist')));

const server = http.createServer(app);

// const specs = swaggerJsdoc(require('./services/swagger_options'));

// app.get('/openapi', function (_, res) {
//   res.send(specs);
// });

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

const MEMORY_ALERT_MB = 100;
const routeMemoryStats = {};

const monitoringLevel = !process.env.MONITORING ? 0 : parseInt(process.env.MONITORING);

if (monitoringLevel === 0) console.log('<><><><><><><><><><><><><><><><><><> MONITORING OFF <><>');

if (monitoringLevel === 1) {
  console.log('<><><><><><><><><><><><><><><><><><> ALERT MONITORING ON <><>');

  app.use((req, res, next) => {
    const startHeap = process.memoryUsage().heapUsed;
    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const endHeap = process.memoryUsage().heapUsed;
      const diffMB = (endHeap - startHeap) / 1024 / 1024;

      if (diffMB < MEMORY_ALERT_MB) return;

      const duration =
        Number(process.hrtime.bigint() - start) / 1_000_000;

      console.error(`
        [MEMORY ALERT] ${req.method} ${req.originalUrl}
        Heap Δ: ${diffMB.toFixed(2)} MB
        Duration: ${duration.toFixed(2)} ms
        Params: ${JSON.stringify(req.params)}
        Query: ${JSON.stringify(req.query)}` // Body: ${JSON.stringify(req.body)}
      );
    });

    next();
  });
}

if (monitoringLevel === 2) {
  console.log('<><><><><><><><><><><><><><><><><><> CONTINUOS MONITORING ON <><>');

  setInterval(() => {
    const { heapUsed, rss, heapTotal } = process.memoryUsage();

    console.log(
      `[MEMORY] HeapUsed: ${(heapUsed / 1024 / 1024).toFixed(2)} MB | ` +
      `HeapTotal: ${(heapTotal / 1024 / 1024).toFixed(2)} MB | ` +
      `RSS: ${(rss / 1024 / 1024).toFixed(2)} MB`
    );
  }, 10000);


  app.use((req, res, next) => {
    const startHeap = process.memoryUsage().heapUsed;

    res.on("finish", () => {
      const endHeap = process.memoryUsage().heapUsed;
      const diffMB = (endHeap - startHeap) / 1024 / 1024;

      const route = `${req.method} ${req.route?.path}`;

      if (!routeMemoryStats[route]) {
        routeMemoryStats[route] = [];
      }

      routeMemoryStats[route].push(diffMB);

      const avg =
        routeMemoryStats[route].reduce((a, b) => a + b, 0) /
        routeMemoryStats[route].length;

      console.log(
        `[REQ] ${route} | Heap Δ: ${diffMB.toFixed(2)} MB | Avg: ${avg.toFixed(2)} MB`
      );
    });

    next();
  });
}

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
