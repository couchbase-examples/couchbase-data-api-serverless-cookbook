#!/bin/bash

# Script to create FTS index for hotel geo-spatial search
# This creates a Full Text Search index called 'hotel-geo-index' that enables proximity searches on hotel documents.
# 
# Prerequisites:
# - Couchbase Server with Data API enabled
# - travel-sample bucket loaded with hotel documents in inventory.hotel collection
# - Hotels must have geo coordinates (geo.lat and geo.lon fields) for proximity search
#
# Usage:
# 1. Set your environment variables:
#    export DATA_API_USERNAME="your_username"
#    export DATA_API_PASSWORD="your_password"
#    export DATA_API_ENDPOINT="your_endpoint"
# 2. Run this script: ./scripts/create-fts-index.sh

# Check if environment variables are set
if [ -z "$DATA_API_USERNAME" ] || [ -z "$DATA_API_PASSWORD" ] || [ -z "$DATA_API_ENDPOINT" ]; then
    echo "Error: Please set the following environment variables:"
    echo "  DATA_API_USERNAME"
    echo "  DATA_API_PASSWORD"
    echo "  DATA_API_ENDPOINT"
    exit 1
fi

# Index configuration
INDEX_NAME="hotel-geo-index"
BUCKET_NAME="travel-sample"
SCOPE_NAME="inventory"

# Construct the URL
URL="https://${DATA_API_ENDPOINT}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}"

echo "Creating FTS index '${INDEX_NAME}' for geo-spatial hotel search..."
echo "URL: ${URL}"

# Create the FTS index with geo-spatial mapping
curl -X PUT "${URL}" \
  -u "${DATA_API_USERNAME}:${DATA_API_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fulltext-index",
    "name": "hotel-geo-index",
    "sourceType": "gocbcore",
    "sourceName": "travel-sample",
    "sourceParams": {},
    "planParams": {
      "maxPartitionsPerPIndex": 1024,
      "indexPartitions": 1
    },
    "params": {
      "doc_config": {
        "docid_prefix_delim": "",
        "docid_regexp": "",
        "mode": "scope.collection.type_field",
        "type_field": "type"
      },
      "mapping": {
        "analysis": {},
        "default_analyzer": "standard",
        "default_datetime_parser": "dateTimeOptional",
        "default_field": "_all",
        "default_mapping": {
          "dynamic": true,
          "enabled": false
        },
        "default_type": "_default",
        "docvalues_dynamic": false,
        "index_dynamic": true,
        "store_dynamic": false,
        "type_field": "_type",
        "types": {
          "inventory.hotel": {
            "dynamic": true,
            "enabled": true,
            "properties": {
              "geo": {
                "dynamic": false,
                "enabled": true,
                "fields": [
                  {
                    "analyzer": "keyword",
                    "include_in_all": true,
                    "include_term_vectors": true,
                    "index": true,
                    "name": "geo",
                    "store": true,
                    "type": "geopoint"
                  }
                ]
              },
              "name": {
                "dynamic": false,
                "enabled": true,
                "fields": [
                  {
                    "analyzer": "standard",
                    "include_in_all": true,
                    "include_term_vectors": true,
                    "index": true,
                    "name": "name",
                    "store": true,
                    "type": "text"
                  }
                ]
              },
              "city": {
                "dynamic": false,
                "enabled": true,
                "fields": [
                  {
                    "analyzer": "standard",
                    "include_in_all": true,
                    "include_term_vectors": true,
                    "index": true,
                    "name": "city",
                    "store": true,
                    "type": "text"
                  }
                ]
              }
            }
          }
        }
      },
      "store": {
        "indexType": "scorch",
        "segmentVersion": 15
      }
    }
  }'

echo ""
echo "FTS index creation completed!"
echo "Note: The index is being built in the background. Use the hotel search endpoint once the index is ready." 