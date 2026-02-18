const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config()

// --- CONFIGURATION ---
const PROXY_URL = 'http://localhost:3000'; // Your Rust server address
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';      // Must match Rust state.jwt_secret
const SERVICES = ['go-service', 'node-service'];

// 1. Generate a valid JWT
const token = jwt.sign(
    { 
        sub: 'user_999', 
        exp: Math.floor(Date.now() / 1000) + (60 * 60) 
    }, 
    JWT_SECRET, 
    { algorithm: 'HS256' }
);

async function runTests() {
    console.log(`🚀 Starting Proxy Tests...`);
    console.log(`🔑 Using Token: ${token.substring(0, 15)}...\n`);

    for (const service of SERVICES) {
        // The URL pattern: /proxy/{token}/{service}/{path}
        const fullUrl = `${PROXY_URL}/${token}/${service}/info`;
        
        console.log(`📡 Requesting: ${service.toUpperCase()} via Proxy...`);
        
        try {
            const response = await axios.get(fullUrl);
            
            console.log(`✅ Success from ${service}:`);
            console.log(`   - Status: ${response.status}`);
            console.log(`   - Body:`, response.data);
            console.log(`   - Verified ID: ${response.data.your_id}\n`);
            
        } catch (error) {
            console.error(`❌ Failed to reach ${service}:`);
            if (error.response) {
                console.error(`   - Status: ${error.response.status}`);
                console.error(`   - Data:`, error.response.data);
            } else {
                console.error(`   - Error: ${error.message}`);
            }
            console.log('');
        }
    }
}

runTests();