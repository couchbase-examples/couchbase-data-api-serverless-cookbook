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
 *    export USERNAME="your_username"
 *    export CLUSTER_PASSWORD="your_password"
 *    export BASE_URL="your_endpoint"
 * 2. Run this script: node scripts/create-fts-index.mjs
 */

// Check if environment variables are set
const requiredEnvVars = ['USERNAME', 'CLUSTER_PASSWORD', 'BASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Error: Please set the following environment variables:');
    missingEnvVars.forEach(varName => console.error(`  ${varName}`));
    process.exit(1);
}

// Index configuration
const INDEX_NAME = 'hotel-geo-index';
const BUCKET_NAME = 'travel-sample';
const SCOPE_NAME = 'inventory';

// Construct the URL - remove https:// from BASE_URL if present
const baseUrl = process.env.BASE_URL.replace(/^https?:\/\//, '');
const url = `https://${baseUrl}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}`;

// Index definition
const indexDefinition = {
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

async function createFTSIndex() {
    console.log(`Creating FTS index '${INDEX_NAME}' for geo-spatial hotel search...`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${process.env.USERNAME}:${process.env.CLUSTER_PASSWORD}`).toString('base64')
            },
            body: JSON.stringify(indexDefinition)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        console.log('\nFTS index creation completed!');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\nNote: The index is being built in the background. Use the hotel search endpoint once the index is ready.');
    } catch (error) {
        console.error('Error creating FTS index:', error);
        process.exit(1);
    }
}

// Execute the function
createFTSIndex(); 