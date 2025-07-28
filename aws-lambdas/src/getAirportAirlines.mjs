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
            "Content-Type": "application/json"
        },
        isBase64Encoded: false,
        body: JSON.stringify({
            error: error.message
        })
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

        // Get parameters from path parameters
        const airportCode = event.pathParameters?.airportCode;
        if (!airportCode) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport code is required as a path parameter"
            });
        }

        const baseUrl = process.env.DATA_API_URL;
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

        // Make the HTTP request using fetch
        const url = `${baseUrl}/_p/query/query/service`;
        
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

        const responseData = await fetchResponse.text();

        if (fetchResponse.ok) {
            const queryResponse = JSON.parse(responseData);
            return {
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
            };
        } else {
            return formatError({
                statusCode: fetchResponse.status,
                message: responseData || 'An error occurred processing the request'
            });
        }

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 