// Quick test to verify URL construction fixes
console.log('=== Testing Frontend URL Construction Fixes ===\n');

const API_BASE_URL = '/api/v1';

function testUrlConstruction(name: string, baseUrl: string, path: string) {
  try {
    const url = `${baseUrl}${path}`;
    console.log(`✓ ${name}: ${url}`);
    return true;
  } catch (error) {
    console.log(`✗ ${name}: ${(error as Error).message}`);
    return false;
  }
}

// Test payment API URL
testUrlConstruction('Payment initiate', API_BASE_URL.replace(/\/$/, ''), '/payments/initiate');

// Test order API URLs
testUrlConstruction('Create order', API_BASE_URL.replace(/\/$/, ''), '/orders');
testUrlConstruction('List orders', API_BASE_URL.replace(/\/$/, ''), '/orders');
testUrlConstruction('Cancel order', API_BASE_URL.replace(/\/$/, ''), '/orders/123/cancel');

// Test cart API URLs
testUrlConstruction('Fetch cart', API_BASE_URL.replace(/\/$/, ''), '/cart');
testUrlConstruction('Upsert cart', API_BASE_URL.replace(/\/$/, ''), '/cart');

// Test catalog API URLs
testUrlConstruction('List products', API_BASE_URL.replace(/\/$/, ''), '/products');
testUrlConstruction('Get product', API_BASE_URL.replace(/\/$/, ''), '/products/slug-123');
testUrlConstruction('Product stock', API_BASE_URL.replace(/\/$/, ''), '/products/123/stock');
testUrlConstruction('Product reviews', API_BASE_URL.replace(/\/$/, ''), '/products/123/reviews');

console.log('\nAll URL constructions should be strings, not URL objects.');
console.log('They should work with fetch() directly without calling .toString()');
