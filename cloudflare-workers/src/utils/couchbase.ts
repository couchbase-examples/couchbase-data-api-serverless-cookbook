import { Env } from '../types/env';

// Couchbase Data API configurations
const BUCKET_NAME = "travel-sample";
const SCOPE_NAME = "inventory";
const COLLECTION_NAME = "airport";

// Helper function to create auth headers
export const getAuthHeaders = (env: Env) => {
	const token = `${env.DATA_API_USERNAME}:${env.DATA_API_PASSWORD}`;
	const encodedToken = btoa(token);
	return {
		'Authorization': `Basic ${encodedToken}`,
		'Content-Type': 'application/json',
	};
};

// Helper function to construct document URL
export const getDocumentUrl = (env: Env, documentKey: string) => {
	return `https://${env.DATA_API_ENDPOINT}/v1/buckets/${BUCKET_NAME}/scopes/${SCOPE_NAME}/collections/${COLLECTION_NAME}/documents/${documentKey}`;
};

// Helper function to construct query URL
export const getQueryUrl = (env: Env) => {
	return `https://${env.DATA_API_ENDPOINT}/_p/query/query/service`;
};

// Helper function to construct FTS search URL
export const getFTSSearchUrl = (env: Env, indexName: string) => {
	return `https://${env.DATA_API_ENDPOINT}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${indexName}/query`;
};

// Helper function to construct FTS index creation URL
export const getFTSIndexUrl = (env: Env, indexName: string) => {
	return `https://${env.DATA_API_ENDPOINT}/_p/fts/api/bucket/${BUCKET_NAME}/scope/${SCOPE_NAME}/index/${indexName}`;
}; 