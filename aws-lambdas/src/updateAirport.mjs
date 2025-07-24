// Collection configuration
const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
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

export const handler = async (event) => {
    try {
        // Configuration validation
        if (!process.env.DATA_API_URL) {
            return formatError({
                statusCode: 500,
                code: "ConfigurationError",
                message: "DATA_API_URL environment variable is not set"
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

        // Parse request body
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Invalid JSON in request body"
            });
        }

        if (!airportData.airportname || !airportData.city || !airportData.country) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Required fields missing: airportname, city, country"
            });
        }

        // Ensure the ID in the path matches the body
        airportData.id = airportId;
        airportData.type = 'airport';

        const baseUrl = process.env.DATA_API_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify(airportData);

        // Make the HTTP request using fetch
        const url = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const fetchResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

        const responseData = await fetchResponse.text();

        if (fetchResponse.ok) {
            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                    'etag': fetchResponse.headers.get('etag'),
                    'x-cb-mutationtoken': fetchResponse.headers.get('x-cb-mutationtoken')
                },
                body: JSON.stringify({
                    message: 'Airport updated successfully',
                    id: airportId
                }),
                isBase64Encoded: false
            };
        } else {
            const errorCode = fetchResponse.status === 404 ? 'DocumentNotFound' :
                            fetchResponse.status === 403 ? 'InvalidAuth' :
                            fetchResponse.status === 409 ? 'CasMismatch' :
                            fetchResponse.status === 400 ? 'InvalidArgument' : 'InternalError';
            return formatError({
                statusCode: fetchResponse.status,
                code: errorCode,
                message: responseData || 'An error occurred processing the request'
            });
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