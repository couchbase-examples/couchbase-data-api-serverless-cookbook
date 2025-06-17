const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DATA_API_ENDPOINT = process.env.DATA_API_ENDPOINT;
const DB_BUCKET_NAME = process.env.DB_BUCKET_NAME;
const DB_SCOPE = process.env.DB_SCOPE || '_default';
const DB_COLLECTION = process.env.DB_COLLECTION || '_default';

if (!DB_USERNAME) {
  throw new Error(
    'Please define the DB_USERNAME environment variable'
  );
}

if (!DB_PASSWORD) {
  throw new Error(
    'Please define the DB_PASSWORD environment variable'
  );
}

if (!DATA_API_ENDPOINT) {
  throw new Error(
    'Please define the DATA_API_ENDPOINT environment variable'
  );
}

if (!DB_BUCKET_NAME) {
  throw new Error(
    'Please define the DB_BUCKET_NAME environment variable'
  );
}

function getDataApiConfig() {
  return {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    endpoint: DATA_API_ENDPOINT,
    bucketName: DB_BUCKET_NAME,
    scope: DB_SCOPE,
    collection: DB_COLLECTION
  };
}

function getDocumentUrl (documentKey) {
	return `https://${DATA_API_ENDPOINT}/v1/buckets/${DB_BUCKET_NAME}/scopes/${DB_SCOPE}/collections/${DB_COLLECTION}/documents/${documentKey}`;
};

function getQueryUrl() {
  return `https://${DATA_API_ENDPOINT}/_p/query/query/service`;
}

function getFTSSearchUrl(indexName) {
  return `https://${DATA_API_ENDPOINT}/_p/fts/api/bucket/${DB_BUCKET_NAME}/scope/${DB_SCOPE}/index/${indexName}/query`;
}

export { getDataApiConfig, getQueryUrl, getFTSSearchUrl, getDocumentUrl };