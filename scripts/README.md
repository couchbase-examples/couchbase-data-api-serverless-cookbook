# Scripts

This folder contains common scripts used across all serverless implementations.

## FTS Index Creation

### `create-fts-index.js`

Creates a Full Text Search index (`hotel-geo-index`) with geo-spatial mapping for hotel proximity searches.

**Prerequisites:**
- Couchbase Capella cluster with Data API enabled
- travel-sample bucket loaded with hotel documents in `inventory.hotel` collection
- Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

**Usage:**

1. Set your environment variables:
```bash
export DATA_API_USERNAME="your_username"
export DATA_API_PASSWORD="your_password"
export DATA_API_ENDPOINT="your_endpoint"
```

2. Run the script:
```bash
node scripts/create-fts-index.js
```

**Note:** The index is built in the background after creation. Wait for the index to be ready before using hotel proximity search functionality. 