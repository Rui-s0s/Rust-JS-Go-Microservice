const express = require('express');

const services = [
  { name: 'users', port: 3001 },
  { name: 'admin', port: 3002 },
];

services.forEach(service => {
  const app = express();
  app.use(express.json());

  // 1. Log every incoming request
  app.use((req, res, next) => {
    console.log(`[${service.name.toUpperCase()}] ${req.method} ${req.url}`);
    next();
  });

  // 2. The "Catch-All" - No special characters needed
  // In Express, app.use matches anything starting with the path provided.
  // Using '/' matches every single request.
  app.use('/', (req, res) => {
    res.json({
      service: service.name,
      received_path: req.url,
      method: req.method,
      message: `Success! The ${service.name} service received your proxied request.`
    });
  });

  app.listen(service.port, () => {
    console.log(`✅ ${service.name} listening on http://localhost:${service.port}`);
  });
});