// Test script to verify URL construction logic
console.log('=== Testing URL Construction ===\n');

// Test 1: Normal URL construction
console.log('Test 1: Normal URL construction');
try {
  const url = new URL('/payments/initiate', 'http://localhost:4050');
  console.log('✓ OK:', url.toString());
} catch (error) {
  console.log('✗ FAIL:', (error as Error).message);
}

// Test 2: URL with invalid base (empty string)
console.log('\nTest 2: Empty base URL');
try {
  const url = new URL('/payments/initiate', '');
  console.log('✓ OK:', url.toString());
} catch (error) {
  console.log('✗ FAIL (expected):', (error as Error).message);
}

// Test 3: URL with null/undefined
console.log('\nTest 3: Null/undefined base URL');
try {
  const url = new URL('/payments/initiate', null as any);
  console.log('✓ OK:', url.toString());
} catch (error) {
  console.log('✗ FAIL (expected):', (error as Error).message);
}

// Test 4: URL with whitespace
console.log('\nTest 4: Whitespace-only base URL');
try {
  const url = new URL('/payments/initiate', '   ');
  console.log('✓ OK:', url.toString());
} catch (error) {
  console.log('✗ FAIL (expected):', (error as Error).message);
}

// Test 5: Safe construction with fallback
console.log('\nTest 5: Safe normalization with fallback');
function normalizeServiceUrl(envUrl: string | undefined, defaultUrl: string): string {
  const url = (envUrl || '').trim() || defaultUrl;
  try {
    new URL(url);
    return url;
  } catch (error) {
    console.log(`  Fallback used: "${(error as Error).message}"`);
    return defaultUrl;
  }
}

const result1 = normalizeServiceUrl(undefined, 'http://localhost:4050');
console.log('  Result with undefined:', result1);

const result2 = normalizeServiceUrl('   ', 'http://localhost:4050');
console.log('  Result with whitespace:', result2);

const result3 = normalizeServiceUrl('http://payment-service:4050', 'http://localhost:4050');
console.log('  Result with valid URL:', result3);

// Test 6: BuildServiceUrl function
console.log('\nTest 6: Safe buildServiceUrl function');
function buildServiceUrl(baseUrl: string, path: string): URL {
  try {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error(`Invalid baseUrl type or value: ${typeof baseUrl} = "${baseUrl}"`);
    }
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      throw new Error(`baseUrl must start with http:// or https://: "${baseUrl}"`);
    }
    const result = new URL(path, baseUrl);
    return result;
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.log(`  Error: ${errorMsg}`);
    throw error;
  }
}

try {
  const url = buildServiceUrl('http://localhost:4050', '/payments/initiate');
  console.log('✓ Valid URL:', url.toString());
} catch (e) {
  console.log('✗ Expected to work');
}

try {
  const url = buildServiceUrl('', '/payments/initiate');
  console.log('✗ Should have failed');
} catch (e) {
  console.log('✓ Correctly rejected empty base');
}

try {
  const url = buildServiceUrl('localhost:4050', '/payments/initiate');
  console.log('✗ Should have failed');
} catch (e) {
  console.log('✓ Correctly rejected URL without protocol');
}

console.log('\n=== All Tests Complete ===');
