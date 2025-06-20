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
#    export USERNAME="your_username"
#    export CLUSTER_PASSWORD="your_password"
#    export BASE_URL="your_endpoint"
# 2. Run this script: ./scripts/create-fts-index.sh

# Check if environment variables are set
if [ -z "$USERNAME" ] || [ -z "$CLUSTER_PASSWORD" ] || [ -z "$BASE_URL" ]; then
    echo "Error: Please set the following environment variables:"
    echo "  USERNAME"
    echo "  CLUSTER_PASSWORD"
    echo "  BASE_URL"
    exit 1
fi

# Index configuration
INDEX_NAME="hotel-geo-index"
BUCKET_NAME="travel-sample"
SCOPE_NAME="inventory"

# Construct the URL - handle BASE_URL with or without protocol
if [[ "$BASE_URL" == https://* ]]; then
    URL="${BASE_URL}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}"
elif [[ "$BASE_URL" == http://* ]]; then
    URL="${BASE_URL}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}"
else
    URL="https://${BASE_URL}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${INDEX_NAME}"
fi

echo "Creating FTS index '${INDEX_NAME}' for geo-spatial hotel search..."
echo "URL: ${URL}"

# Create the FTS index with geo-spatial mapping
curl -X PUT "${URL}" \
  -u "${USERNAME}:${CLUSTER_PASSWORD}" \
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