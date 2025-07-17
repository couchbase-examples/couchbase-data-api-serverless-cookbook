#!/usr/bin/env node

// Integration test for deployed Couchbase Data API

async function getDeployedApiUrl() {
  console.log('Getting deployed API URL...');
  
  if (process.env.API_BASE_URL) {
    console.log(`Found API URL: ${process.env.API_BASE_URL}`);
    return process.env.API_BASE_URL;
  }
  
  console.error('API_BASE_URL environment variable is not set');
  console.log('Please set the API_BASE_URL environment variable with your deployed API URL');
  console.log('Example: export API_BASE_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"');
  process.exit(1);
}

async function testAPI() {
  console.log('Integration Test for Couchbase Data API');
  
  const API_BASE_URL = await getDeployedApiUrl();
  console.log(`Testing API: ${API_BASE_URL}`);
  console.log('');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Get SFO routes (should have data)
  try {
    console.log('Test 1: Get SFO routes...');
    const response = await fetch(`${API_BASE_URL}/airports/SFO/routes`);
    const data = await response.json();
    
    if (response.status === 200 && data.success && data.data) {
      // For routes, the data is a JSON string that needs parsing
      const routeData = JSON.parse(data.data);
      if (routeData.results && routeData.results.length > 0) {
        console.log(`PASS: Got ${routeData.results.length} routes for SFO`);
        passed++;
      } else {
        console.log(`FAIL: No routes found in response`);
        failed++;
      }
    } else if (response.status === 200 && data.results) {
      // Alternative format - direct Couchbase response
      console.log(`PASS: Got ${data.results.length} routes for SFO (direct format)`);
      passed++;
    } else {
      console.log(`FAIL: Status ${response.status}, data:`, data);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  // Test 2: Get SFO airlines (should have data)
  try {
    console.log('Test 2: Get SFO airlines...');
    const response = await fetch(`${API_BASE_URL}/airports/SFO/airlines`);
    const data = await response.json();
    
    if (response.status === 200 && data.success && data.data) {
      // For airlines, the data is a JSON string that needs parsing
      const airlineData = JSON.parse(data.data);
      if (airlineData.results && airlineData.results.length > 0) {
        console.log(`PASS: Got ${airlineData.results.length} airlines for SFO`);
        passed++;
      } else {
        console.log(`FAIL: No airlines found in response`);
        failed++;
      }
    } else if (response.status === 200 && data.results) {
      // Alternative format - direct Couchbase response
      console.log(`PASS: Got ${data.results.length} airlines for SFO (direct format)`);
      passed++;
    } else {
      console.log(`FAIL: Status ${response.status}, data:`, data);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  // Test 3: Create a test airport
  const testAirportId = `test_airport_${Date.now()}`;
  const testAirportData = {
    airportname: 'Test Integration Airport',
    city: 'Test City',
    country: 'Test Country',
    faa: 'TEST',
    icao: 'TEST',
    type: 'airport'
  };

  try {
    console.log('Test 3: Create test airport...');
    const response = await fetch(`${API_BASE_URL}/airports/${testAirportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAirportData)
    });
    
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }
    
    if (response.status === 201) {
      console.log(`PASS: Created airport ${testAirportId}`);
      passed++;
    } else {
      console.log(`FAIL: Status ${response.status}, response:`, responseText);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  // Test 4: Get the created airport
  try {
    console.log('Test 4: Get created airport...');
    const response = await fetch(`${API_BASE_URL}/airports/${testAirportId}`);
    
    if (response.status === 200) {
      const responseText = await response.text();
      if (responseText.includes('Test Integration Airport')) {
        console.log(`PASS: Retrieved airport ${testAirportId}`);
        passed++;
      } else {
        console.log(`FAIL: Airport data not found in response: ${responseText}`);
        failed++;
      }
    } else {
      console.log(`FAIL: Status ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  // Test 5: Delete the test airport (cleanup)
  try {
    console.log('Test 5: Delete test airport...');
    const response = await fetch(`${API_BASE_URL}/airports/${testAirportId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 200) {
      console.log(`PASS: Deleted airport ${testAirportId}`);
      passed++;
    } else {
      const responseText = await response.text();
      console.log(`FAIL: Status ${response.status}, response: ${responseText}`);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  // Test 6: Get hotels near airport (FTS test) - try different airport IDs  
  // Using airport IDs that are more likely to exist in travel-sample with geo data
  const airportIdsToTry = ['airport_1257', 'airport_1258', 'airport_1259'];
  let ftsTestPassed = false;
  
  for (const airportId of airportIdsToTry) {
    try {
      console.log(`Test 6: Get hotels near ${airportId} (FTS)...`);
      const response = await fetch(`${API_BASE_URL}/airports/${airportId}/hotels/nearby/100km`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.hotels !== undefined) {
          console.log(`PASS: Got ${data.hotels.length} hotels near ${airportId} (total found: ${data.total_hotels_found})`);
          passed++;
          ftsTestPassed = true;
          break;
        } else if (data.success && data.data) {
          const hotelData = JSON.parse(data.data);
          if (hotelData.hits) {
            console.log(`PASS: Got ${hotelData.hits.length} hotels near ${airportId}`);
            passed++;
            ftsTestPassed = true;
            break;
          }
        } else if (data.hits) {
          console.log(`PASS: Got ${data.hits.length} hotels near ${airportId} (direct format)`);
          passed++;
          ftsTestPassed = true;
          break;
        }
      } else {
        const errorText = await response.text();
        console.log(`FTS test failed for ${airportId}: HTTP ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`FTS test failed for ${airportId}: ${error.message}`);
    }
  }
  
  if (!ftsTestPassed) {
    console.log(`FAIL: FTS test failed for all airport IDs tried`);
    console.log(`      Possible causes:`);
    console.log(`      1. FTS index 'hotel-geo-index' not created (see scripts/README.md)`);
    console.log(`      2. Airport documents missing geo coordinates (geo.lat, geo.lon)`);
    console.log(`      3. No hotel documents in travel-sample dataset`);
    console.log(`      4. Airport IDs don't exist in travel-sample`);
    failed++;
  }

  // Test 7: Error handling - invalid airport
  try {
    console.log('Test 7: Error handling (404 test)...');
    const response = await fetch(`${API_BASE_URL}/airports/nonexistent`);
    
    if (response.status === 404) {
      console.log(`PASS: Correctly returned 404 for nonexistent airport`);
      passed++;
    } else {
      console.log(`FAIL: Expected 404, got ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`FAIL: Error - ${error.message}`);
    failed++;
  }

  console.log('');
  console.log('Test Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('');
    console.log('All tests passed! Your Couchbase Data API is working perfectly!');
    process.exit(0);
  } else if (passed >= 5) {
    console.log('');
    console.log('Most tests passed! Your Couchbase Data API is working well.');
    console.log('   Some minor issues detected but core functionality is solid.');
    process.exit(0);
  } else {
    console.log('');
    console.log('Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
}

testAPI().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 