#!/usr/bin/env node

/**
 * Script to create FTS index for hotel geo-spatial search
 * This creates a Full Text Search index called 'hotel-geo-index' that enables proximity searches on hotel documents.
 * 
 * Prerequisites:
 * - Couchbase Server with Data API enabled
 * - travel-sample bucket loaded with hotel documents in inventory.hotel collection
 * - Hotels must have geo coordinates (geo.lat and geo.lon fields) for proximity search
 *
 * Usage:
 * 1. Set your environment variables:
 *    export DATA_API_USERNAME="your_username"
 *    export DATA_API_PASSWORD="your_password"
 *    export DATA_API_ENDPOINT="your_endpoint"
 * 2. Run this script: node scripts/create-fts-index.js
 */


const https = require('https');
const http = require('http');
const { URL } = require('url');

// Check if environment variables are set
const { DATA_API_USERNAME, DATA_API_PASSWORD, DATA_API_ENDPOINT } = process.env;

if (!DATA_API_USERNAME || !DATA_API_PASSWORD || !DATA_API_ENDPOINT) {
  console.error('Error: Please set the following environment variables:');
  console.error('  DATA_API_USERNAME');
  console.error('  DATA_API_PASSWORD');
  console.error('  DATA_API_ENDPOINT');
  process.exit(1);
}

// Index configuration
const INDEX_NAME = 'hotel-geo-index';
const BUCKET_NAME = 'travel-sample';
const SCOPE_NAME = 'inventory';

// Construct the URL
const cleanEndpoint = DATA_API_ENDPOINT.replace(/^https?:\/\//, '');
const apiUrl = `https://${cleanEndpoint}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}`;

console.log(`Creating FTS index '${INDEX_NAME}' for geo-spatial hotel search...`);
console.log(`URL: ${apiUrl}`);

// FTS index configuration
const indexConfig = {
  type: 'fulltext-index',
  name: 'hotel-geo-index',
  sourceType: 'gocbcore',
  sourceName: 'travel-sample',
  sourceParams: {},
  planParams: {
    maxPartitionsPerPIndex: 1024,
    indexPartitions: 1
  },
  params: {
    doc_config: {
      docid_prefix_delim: '',
      docid_regexp: '',
      mode: 'scope.collection.type_field',
      type_field: 'type'
    },
    mapping: {
      analysis: {},
      default_analyzer: 'standard',
      default_datetime_parser: 'dateTimeOptional',
      default_field: '_all',
      default_mapping: {
        dynamic: true,
        enabled: false
      },
      default_type: '_default',
      docvalues_dynamic: false,
      index_dynamic: true,
      store_dynamic: false,
      type_field: '_type',
      types: {
        'inventory.hotel': {
          dynamic: true,
          enabled: true,
          properties: {
            geo: {
              dynamic: false,
              enabled: true,
              fields: [
                {
                  analyzer: 'keyword',
                  include_in_all: true,
                  include_term_vectors: true,
                  index: true,
                  name: 'geo',
                  store: true,
                  type: 'geopoint'
                }
              ]
            },
            name: {
              dynamic: false,
              enabled: true,
              fields: [
                {
                  analyzer: 'standard',
                  include_in_all: true,
                  include_term_vectors: true,
                  index: true,
                  name: 'name',
                  store: true,
                  type: 'text'
                }
              ]
            },
            city: {
              dynamic: false,
              enabled: true,
              fields: [
                {
                  analyzer: 'standard',
                  include_in_all: true,
                  include_term_vectors: true,
                  index: true,
                  name: 'city',
                  store: true,
                  type: 'text'
                }
              ]
            }
          }
        }
      }
    },
    store: {
      indexType: 'scorch',
      segmentVersion: 15
    }
  }
};

// Create HTTP request
const parsedUrl = new URL(apiUrl);
const auth = Buffer.from(`${DATA_API_USERNAME}:${DATA_API_PASSWORD}`).toString('base64');
const postData = JSON.stringify(indexConfig);

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.pathname,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'Authorization': `Basic ${auth}`
  }
};

const requestModule = parsedUrl.protocol === 'https:' ? https : http;

const req = requestModule.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nFTS index creation completed!');
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Success! The index is being built in the background.');
      console.log('Note: Use the hotel search endpoint once the index is ready.');
    } else {
      console.log('❌ Error creating index:');
      console.log(data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error creating FTS index:', err.message);
  process.exit(1);
});

// Send the request
req.write(postData);
req.end(); 