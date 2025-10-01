#!/usr/bin/env node

/**
 * Simple load testing script for notification system
 * Tests performance under concurrent load
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60; // seconds
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 20;

// Test results
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
  endTime: null,
};

// Utility functions
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Notification-Load-Test/1.0',
      },
    };

    const req = protocol.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        results.totalRequests++;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push({
            statusCode: res.statusCode,
            url,
            timestamp: Date.now(),
          });
        }

        results.responseTimes.push(Date.now() - Date.now()); // Placeholder for timing

        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push({
        error: error.message,
        url,
        timestamp: Date.now(),
      });
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function simulateUserBehavior(userId) {
  console.log(`👤 User ${userId}: Starting test session`);

  try {
    // Simulate user loading the app
    await makeRequest(`${BASE_URL}/`);

    // Simulate multiple notification checks
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      // Random delay between requests (100-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));

      // Simulate checking notifications
      await makeRequest(`${BASE_URL}/api/notifications`);

      // Occasionally simulate creating a notification
      if (Math.random() < 0.1) { // 10% chance
        await makeRequest(`${BASE_URL}/api/notifications`, 'POST', {
          type: 'test',
          title: `Load Test Notification ${i}`,
          message: `Message from user ${userId}`,
        });
      }

      // Simulate marking notifications as read
      if (Math.random() < 0.2) { // 20% chance
        await makeRequest(`${BASE_URL}/api/notifications/read`, 'POST', {
          notificationId: `test-notification-${i}`,
        });
      }
    }

    console.log(`✅ User ${userId}: Completed test session`);
  } catch (error) {
    console.error(`❌ User ${userId}: Test session failed`, error.message);
  }
}

async function runLoadTest() {
  console.log('🚀 Starting notification system load test');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent users: ${CONCURRENT_USERS}`);
  console.log(`   - Test duration: ${TEST_DURATION}s`);
  console.log(`   - Requests per user: ${REQUESTS_PER_USER}`);
  console.log(`   - Target URL: ${BASE_URL}`);
  console.log('');

  // Start multiple user simulations
  const userPromises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUserBehavior(i + 1));
  }

  // Run for specified duration
  const testPromise = Promise.all(userPromises);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout')), TEST_DURATION * 1000);
  });

  try {
    await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Test timeout') {
      console.log(`⏰ Test duration (${TEST_DURATION}s) reached`);
    } else {
      console.error('❌ Load test failed:', error.message);
    }
  }

  // Calculate results
  results.endTime = Date.now();
  const duration = (results.endTime - results.startTime) / 1000;

  console.log('');
  console.log('📊 Load Test Results:');
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Total requests: ${results.totalRequests}`);
  console.log(`   Successful requests: ${results.successfulRequests}`);
  console.log(`   Failed requests: ${results.failedRequests}`);
  console.log(`   Success rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%`);

  if (results.responseTimes.length > 0) {
    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
  }

  if (results.errors.length > 0) {
    console.log(`   Errors encountered: ${results.errors.length}`);
    console.log('   Sample errors:');
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(`     ${index + 1}. ${error.error || `HTTP ${error.statusCode}`} at ${new Date(error.timestamp).toISOString()}`);
    });
  }

  // Performance assessment
  const successRate = (results.successfulRequests / results.totalRequests) * 100;
  const requestsPerSecond = results.totalRequests / duration;

  console.log('');
  console.log('🎯 Performance Assessment:');

  if (successRate >= 95) {
    console.log('✅ Excellent: >95% success rate');
  } else if (successRate >= 90) {
    console.log('🟡 Good: 90-95% success rate');
  } else if (successRate >= 80) {
    console.log('🟠 Acceptable: 80-90% success rate');
  } else {
    console.log('❌ Poor: <80% success rate - system needs optimization');
  }

  if (requestsPerSecond >= 10) {
    console.log('🚀 High throughput: >10 requests/second');
  } else if (requestsPerSecond >= 5) {
    console.log('⚡ Good throughput: 5-10 requests/second');
  } else {
    console.log('🐌 Low throughput: <5 requests/second - may need optimization');
  }

  console.log('');
  console.log('📋 Recommendations:');

  if (results.failedRequests > 0) {
    console.log('🔧 Fix failing endpoints before production deployment');
  }

  if (results.errors.some(e => e.error?.includes('timeout'))) {
    console.log('⏱️ Consider optimizing slow endpoints');
  }

  if (requestsPerSecond < 5) {
    console.log('⚡ Consider performance optimizations for higher throughput');
  }

  console.log('🎉 Load test completed!');
}

// Run the load test
runLoadTest().catch(console.error);
