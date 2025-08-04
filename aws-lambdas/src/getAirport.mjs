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
        if (!process.env.DATA_API_ENDPOINT) {
            return formatError({
                statusCode: 500,
                message: "Internal Server Error"
            });
        }
        if (!process.env.DATA_API_PASSWORD) {
            return formatError({
                statusCode: 500,
                message: "Internal Server Error"
            });
        }
        if (!process.env.DATA_API_USERNAME) {
            return formatError({
                statusCode: 500,
                message: "Internal Server Error"
            });
        }

        // Extract airport ID from path parameters
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid airport ID"
            });
        }

        const baseUrl = process.env.DATA_API_ENDPOINT;
        const username = process.env.DATA_API_USERNAME;
        const password = process.env.DATA_API_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        // Make the HTTP request using fetch
        const url = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const fetchResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });

        let responseData = await fetchResponse.text();

        if (fetchResponse.ok) {
            try {
                const parsedData = JSON.parse(responseData);
                parsedData.id = airportId;
                responseData = JSON.stringify(parsedData);
            } catch (e) {
                console.error('Error parsing response data:', e);
                return formatError({
                    statusCode: 500,
                    message: "Error parsing response data from " + url
                });
            }

            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                },
                body: responseData,
                isBase64Encoded: false
            };
        } else {
            if (fetchResponse.status === 404) {
                return formatError({
                    statusCode: 404,
                    message: "Airport does not exist"
                });
            } else if (fetchResponse.status === 400) {
                return formatError({
                    statusCode: 400,
                    message: "Invalid airport ID"
                });
            } else {
                return formatError({
                    statusCode: 500,
                    message: "Internal Server Error"
                });
            }
        }

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 