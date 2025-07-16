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

        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (parseError) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Invalid JSON in request body"
            });
        }

        // Validate required fields
        const requiredFields = ['airportname', 'city', 'country'];
        const missingFields = requiredFields.filter(field => !airportData[field]);
        
        if (missingFields.length > 0) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const endpoint = `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const result = await makeCouchbaseRequest(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
        
        if (result.success) {
            return formatSuccess(result.data, 201);
        } else {
            return formatError(result.error);
        }

    } catch (error) {
        console.error('CreateAirport error:', error);
        return formatError({
            statusCode: 500,
            code: "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 