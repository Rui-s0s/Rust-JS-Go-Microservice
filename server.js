const express = require('express');

// Helper to create a service
const createService = (name, port) => {
    const app = express();
    app.use(express.json());

    // Middleware to log the "Injected" header from your Rust Proxy
    app.use((req, res, next) => {
        const userId = req.headers['x-user-id'];
        console.log(`[${name}] Request received for User: ${userId}`);
        next();
    });

    app.get('/info', (req, res) => {
        res.json({
            service: name,
            message: `Hello from the ${name}!`,
            your_id: req.headers['x-user-id']
        });
    });

    app.listen(port, () => console.log(`${name} running on http://localhost:${port}`));
};

// Start Service A (e.g., go-service)
createService('go-service', 8081);

// Start Service B (e.g., node-service)
createService('node-service', 8082);