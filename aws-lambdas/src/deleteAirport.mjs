import https from 'https';

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

        // Create the request options
        const options = {
            hostname: baseUrl.replace('https://', ''),
            path: `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`,
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        };

        // Make the HTTP request
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            statusCode: 200,
                            headers: {
                                'content-type': 'application/json',
                                'x-cb-mutationtoken': res.headers['x-cb-mutationtoken']
                            },
                            body: JSON.stringify({
                                message: 'Airport deleted successfully',
                                id: airportId
                            }),
                            isBase64Encoded: false
                        });
                    } else {
                        const errorCode = res.statusCode === 404 ? 'DocumentNotFound' :
                                        res.statusCode === 403 ? 'InvalidAuth' :
                                        res.statusCode === 409 ? 'CasMismatch' :
                                        res.statusCode === 400 ? 'InvalidArgument' : 'InternalError';
                        resolve(formatError({
                            statusCode: res.statusCode,
                            code: errorCode,
                            message: data || 'An error occurred processing the request'
                        }));
                    }
                });
            });

            req.on('error', (error) => {
                reject({ statusCode: 500, code: "NetworkError", message: error.message });
            });

            req.end();
        });

        return response;

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: error.statusCode || 500,
            code: error.code || "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 