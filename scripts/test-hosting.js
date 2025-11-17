#!/usr/bin/env node

/**
 * Hosting Test Script for Farm Management App
 * Tests basic functionality of the deployed application
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const APP_URL = 'https://friendly-conkies-db6509.netlify.app/';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bold');
  console.log('='.repeat(60));
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Test 1: Basic connectivity
async function testConnectivity() {
  logHeader('Testing Basic Connectivity');
  
  return new Promise((resolve) => {
    const url = new URL(APP_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      logTest('HTTPS Connection', res.statusCode === 200, `Status: ${res.statusCode}`);
      logTest('Content-Type', res.headers['content-type']?.includes('text/html'), 
        `Type: ${res.headers['content-type']}`);
      logTest('Security Headers', 
        res.headers['x-frame-options'] && 
        res.headers['x-content-type-options'], 
        'Security headers present');
      
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        success: res.statusCode === 200
      });
    });
    
    req.on('error', (error) => {
      logTest('HTTPS Connection', false, `Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      logTest('Connection Timeout', false, 'Request timed out after 10 seconds');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Test 2: Check for critical files
async function testCriticalFiles() {
  logHeader('Testing Critical Files');
  
  const criticalFiles = [
    '/manifest.json',
    '/sw.js',
    '/favicon.ico'
  ];
  
  const results = [];
  
  for (const file of criticalFiles) {
    const result = await testFile(APP_URL + file);
    results.push({ file, ...result });
  }
  
  return results;
}

async function testFile(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      const success = res.statusCode === 200;
      logTest(`File: ${urlObj.pathname}`, success, `Status: ${res.statusCode}`);
      resolve({ success, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      logTest(`File: ${urlObj.pathname}`, false, `Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      logTest(`File: ${urlObj.pathname}`, false, 'Timeout');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Test 3: Check Netlify Functions
async function testNetlifyFunctions() {
  logHeader('Testing Netlify Functions');
  
  const functions = [
    '/.netlify/functions/auth'
  ];
  
  const results = [];
  
  for (const func of functions) {
    const result = await testFunction(APP_URL + func);
    results.push({ function: func, ...result });
  }
  
  return results;
}

async function testFunction(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      // Netlify functions should return 200 or 401 for auth endpoints
      const success = res.statusCode === 200 || res.statusCode === 401;
      logTest(`Function: ${urlObj.pathname}`, success, `Status: ${res.statusCode}`);
      resolve({ success, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      logTest(`Function: ${urlObj.pathname}`, false, `Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      logTest(`Function: ${urlObj.pathname}`, false, 'Timeout');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Test 4: Performance check
async function testPerformance() {
  logHeader('Testing Performance');
  
  const startTime = Date.now();
  const result = await testConnectivity();
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  logTest('Response Time', responseTime < 3000, `${responseTime}ms`);
  logTest('Performance Rating', responseTime < 1000 ? 'Excellent' : 
    responseTime < 2000 ? 'Good' : 
    responseTime < 3000 ? 'Fair' : 'Poor');
  
  return { responseTime, performance: result.success };
}

// Test 5: Security headers
function testSecurityHeaders(headers) {
  logHeader('Testing Security Headers');
  
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  let passed = 0;
  let total = Object.keys(securityHeaders).length;
  
  for (const [header, expectedValue] of Object.entries(securityHeaders)) {
    const actualValue = headers[header.toLowerCase()];
    const success = actualValue === expectedValue;
    logTest(`Header: ${header}`, success, 
      success ? `Value: ${actualValue}` : `Expected: ${expectedValue}, Got: ${actualValue}`);
    if (success) passed++;
  }
  
  logTest('Overall Security', passed === total, `${passed}/${total} headers correct`);
  
  return { passed, total, success: passed === total };
}

// Main test runner
async function runTests() {
  logHeader('Farm Management App - Hosting Test Suite');
  log(`Testing application at: ${APP_URL}`, 'blue');
  
  const results = {
    connectivity: null,
    files: null,
    functions: null,
    performance: null,
    security: null
  };
  
  try {
    // Test 1: Connectivity
    results.connectivity = await testConnectivity();
    
    if (results.connectivity.success) {
      // Test 2: Critical files
      results.files = await testCriticalFiles();
      
      // Test 3: Netlify functions
      results.functions = await testNetlifyFunctions();
      
      // Test 4: Performance
      results.performance = await testPerformance();
      
      // Test 5: Security headers
      results.security = testSecurityHeaders(results.connectivity.headers);
    }
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'red');
  }
  
  // Generate summary
  logHeader('Test Summary');
  
  const summary = {
    connectivity: results.connectivity?.success || false,
    files: results.files?.filter(r => r.success).length || 0,
    totalFiles: results.files?.length || 0,
    functions: results.functions?.filter(r => r.success).length || 0,
    totalFunctions: results.functions?.length || 0,
    performance: results.performance?.performance || false,
    security: results.security?.success || false
  };
  
  logTest('Overall Status', 
    summary.connectivity && summary.security && summary.performance,
    'All critical tests passed');
  
  log('\nDetailed Results:', 'bold');
  logTest('Connectivity', summary.connectivity);
  logTest('Critical Files', summary.files === summary.totalFiles, 
    `${summary.files}/${summary.totalFiles} files accessible`);
  logTest('Netlify Functions', summary.functions === summary.totalFunctions,
    `${summary.functions}/${summary.totalFunctions} functions accessible`);
  logTest('Performance', summary.performance);
  logTest('Security Headers', summary.security);
  
  // Recommendations
  logHeader('Recommendations');
  
  if (!summary.connectivity) {
    log('❌ Check Netlify deployment status and DNS configuration', 'red');
  }
  
  if (summary.files < summary.totalFiles) {
    log('⚠️  Some critical files are missing. Check build process', 'yellow');
  }
  
  if (summary.functions < summary.totalFunctions) {
    log('⚠️  Some Netlify functions are not accessible. Check function deployment', 'yellow');
  }
  
  if (!summary.security) {
    log('⚠️  Security headers are not properly configured', 'yellow');
  }
  
  if (summary.connectivity && summary.security && summary.performance) {
    log('✅ Application is ready for manual testing!', 'green');
    log('\nNext steps:', 'bold');
    log('1. Open the application in your browser', 'blue');
    log('2. Test authentication flows', 'blue');
    log('3. Test all major features', 'blue');
    log('4. Test on mobile devices', 'blue');
    log('5. Use the comprehensive testing plan in TESTING_PLAN.md', 'blue');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testConnectivity, testCriticalFiles, testNetlifyFunctions };
