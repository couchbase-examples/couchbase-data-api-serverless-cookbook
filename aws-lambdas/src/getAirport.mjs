// Collection configuration
const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
};

// Document fields configuration
const DOCUMENT_FIELDS = {
    default: ['id', 'airportname', 'city', 'country', 'type'],
    minimal: ['id', 'airportname'],
    full: ['id', 'airportname', 'city', 'country', 'type', 'geo', 'faa', 'icao', 'tz']
};

// Error formatting function
const formatError = function(error) {
    return {
        statusCode: error.statusCode || 500,
        headers: {
            "Content-Type": "text/plain",
            "x-amzn-ErrorType": error.code
        },
        isBase64Encoded: false,
        body: error.code + ": " + error.message
    };
};

// Helper function to build query parameters
const buildQueryParams = (fields = DOCUMENT_FIELDS.default) => {
    return fields.length > 0 ? `?fields=${fields.join(',')}` : '';
};

export const handler = async (event) => {
    try {
        // Configuration validation
        if (!process.env.BASE_URL) {
            return formatError({
                statusCode: 500,
                code: "ConfigurationError",
                message: "BASE_URL environment variable is not set"
            });
        }
        if (!process.env.CLUSTER_PASSWORD) {
            return formatError({
                statusCode: 500,
                code: "ConfigurationError",
                message: "CLUSTER_PASSWORD environment variable is not set"
            });
        }
        if (!process.env.USERNAME) {
            return formatError({
                statusCode: 500,
                code: "ConfigurationError",
                message: "USERNAME environment variable is not set"
            });
        }

        // Extract airport ID from path parameters
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport ID is required"
            });
        }

        const baseUrl = process.env.BASE_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        // Make the HTTP request using fetch
        const url = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}${buildQueryParams()}`;
        
        const fetchResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });

        const responseData = await fetchResponse.text();

        if (fetchResponse.ok) {
            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                    'etag': fetchResponse.headers.get('etag')
                },
                body: responseData,
                isBase64Encoded: false
            };
        } else {
            const errorCode = fetchResponse.status === 404 ? 'DocumentNotFound' :
                            fetchResponse.status === 403 ? 'InvalidAuth' :
                            fetchResponse.status === 400 ? 'InvalidArgument' : 'InternalError';
            return {
                statusCode: fetchResponse.status,
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorCode,
                    message: responseData || 'An error occurred processing the request'
                }),
                isBase64Encoded: false
            };
        }

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: error.statusCode || 500,
            code: error.code || "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 