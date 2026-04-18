#!/usr/bin/env node
// Diagnostic script to test service URL configuration and connectivity

const http = require('http');
const https = require('https');

const services = {
    'Auth Service': process.env.AUTH_SERVICE_URL || 'http://localhost:4010',
    'Catalog Service': process.env.CATALOG_SERVICE_URL || 'http://localhost:4020',
    'Cart Service': process.env.CART_SERVICE_URL || 'http://localhost:4030',
    'Order Service': process.env.ORDER_SERVICE_URL || 'http://localhost:4040',
    'Payment Service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:4050',
    'Email Service': process.env.EMAIL_SERVICE_URL || 'http://localhost:4070'
};

console.log('=== Service URL Diagnostic ===\n');

let completed = 0;
const total = Object.keys(services).length;

Object.entries(services).forEach(([name, url]) => {
    console.log(`Checking ${name}...`);

    // Test URL format
    try {
        const urlObj = new URL('/health', url);
        console.log(`  URL: ${url}`);

        // Test connectivity
        const client = urlObj.protocol === 'https:' ? https : http;
        const req = client.get(urlObj, { timeout: 2000 }, (res) => {
            console.log(`  Status: ✓ Connected (${res.statusCode})\n`);
            completed++;
        });

        req.on('error', (error) => {
            console.log(`  Status: ✗ Error - ${error.code || error.message}\n`);
            completed++;
        });

        req.on('timeout', () => {
            console.log(`  Status: ✗ Timeout\n`);
            req.destroy();
            completed++;
        });

    } catch (error) {
        console.log(`  Status: ✗ Invalid URL - ${error.message}\n`);
        completed++;
    }
});

setTimeout(() => {
    if (completed === total) {
        console.log('Check complete!');
    }
    process.exit(0);
}, 5000);
