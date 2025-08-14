// Shared utilities for AWS lambda handlers
export const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
};

export const validateDataApiConfig = function() {
    const missing = [];
    if (!process.env.DATA_API_ENDPOINT) missing.push('DATA_API_ENDPOINT');
    if (!process.env.DATA_API_USERNAME) missing.push('DATA_API_USERNAME');
    if (!process.env.DATA_API_PASSWORD) missing.push('DATA_API_PASSWORD');
    if (missing.length > 0) {
        return {
            statusCode: 500,
            message: `${missing.join(', ')} environment variable is not set`
        };
    }
    return null;
};

export const getDataApiConfig = function() {
    return {
        baseUrl: process.env.DATA_API_ENDPOINT,
        username: process.env.DATA_API_USERNAME,
        password: process.env.DATA_API_PASSWORD
    };
};

export const buildAuthHeader = function(username, password) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
};

export const getDocumentUrl = function(docId) {
    const cfg = getDataApiConfig();
    return `${cfg.baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${docId}`;
};

export const getQueryUrl = function() {
    const cfg = getDataApiConfig();
    return `${cfg.baseUrl}/_p/query/query/service`;
};

export const getFTSSearchUrl = function(indexName) {
    const cfg = getDataApiConfig();
    return `${cfg.baseUrl}/_p/fts/api/bucket/${COLLECTION_CONFIG.bucket}/scope/${COLLECTION_CONFIG.scope}/index/${indexName}/query`;
};

export const formatError = function(error) {
    return {
        statusCode: error.statusCode || 500,
        headers: {
            "Content-Type": "application/json"
        },
        isBase64Encoded: false,
        body: JSON.stringify({ error: error.message })
    };
};

export const jsonResponse = function(statusCode, bodyObj) {
    return {
        statusCode,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bodyObj),
        isBase64Encoded: false
    };
};


