import https from 'https';

// Collection configuration
const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory'
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

        // Parse request body
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Invalid JSON in request body"
            });
        }
        
        const airportCode = requestData.airportCode;
        if (!airportCode) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport code is required"
            });
        }

        const baseUrl = process.env.BASE_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        // Create query
        const queryBody = {
            statement: `
                SELECT DISTINCT r.airline
                FROM \`${COLLECTION_CONFIG.bucket}\`.\`${COLLECTION_CONFIG.scope}\`.route r 
                WHERE r.sourceairport = ? OR r.destinationairport = ?
                ORDER BY r.airline
            `,
            args: [airportCode, airportCode]
        };

        const body = JSON.stringify(queryBody);

        // Create the request options
        const options = {
            hostname: new URL(baseUrl).hostname,
            path: '/_p/query/query/service',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
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
                        const queryResponse = JSON.parse(data);
                        resolve({
                            statusCode: 200,
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                airlines: queryResponse.results,
                                metadata: {
                                    resultCount: queryResponse.metrics.resultCount,
                                    executionTime: queryResponse.metrics.executionTime
                                }
                            }),
                            isBase64Encoded: false
                        });
                    } else {
                        const errorCode = res.statusCode === 403 ? 'InvalidAuth' :
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

            req.write(body);
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