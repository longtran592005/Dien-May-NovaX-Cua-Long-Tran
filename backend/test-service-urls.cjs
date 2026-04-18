// Diagnostic script to test service URL connectivity
const http = require('http');
const https = require('https');

const serviceUrls = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4010',
    catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4020',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:4030',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:4040',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4050',
    email: process.env.EMAIL_SERVICE_URL || 'http://localhost:4070'
};

console.log('Testing Service URLs...\n');

Object.entries(serviceUrls).forEach(([name, url]) => {
    console.log(`\n${name.toUpperCase()}: ${url}`);

    // Validate URL format
    try {
        new URL('/health', url);
        console.log(`  ✓ URL format valid`);
    } catch (error) {
        console.log(`  ✗ URL format invalid: ${error.message}`);
        return;
    }

    // Test connectivity
    const urlObj = new URL('/health', url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(urlObj, { timeout: 3000 }, (res) => {
        console.log(`  ✓ Connected (HTTP ${res.statusCode})`);
    });

    req.on('error', (error) => {
        console.log(`  ✗ Connection failed: ${error.code || error.message}`);
    });

    req.on('timeout', () => {
        console.log(`  ✗ Connection timeout`);
        req.destroy();
    });
});

console.log('\n\nEnvironment Variables:');
console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL || '(not set)');
console.log('CATALOG_SERVICE_URL:', process.env.CATALOG_SERVICE_URL || '(not set)');
console.log('CART_SERVICE_URL:', process.env.CART_SERVICE_URL || '(not set)');
console.log('ORDER_SERVICE_URL:', process.env.ORDER_SERVICE_URL || '(not set)');
console.log('PAYMENT_SERVICE_URL:', process.env.PAYMENT_SERVICE_URL || '(not set)');
console.log('EMAIL_SERVICE_URL:', process.env.EMAIL_SERVICE_URL || '(not set)');

setTimeout(() => process.exit(0), 5000);
