import { 
    COLLECTION_CONFIG, 
    formatError, 
    formatSuccess, 
    makeCouchbaseRequest 
} from './utils/couchbase.js';

export const handler = async (event) => {
    try {
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport ID is required"
            });
        }

        const endpoint = `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const result = await makeCouchbaseRequest(endpoint);
        
        if (result.success) {
            return formatSuccess(result.data, 200);
        } else {
            return formatError(result.error);
        }

    } catch (error) {
        console.error('GetAirport error:', error);
        return formatError({
            statusCode: 500,
            code: "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 