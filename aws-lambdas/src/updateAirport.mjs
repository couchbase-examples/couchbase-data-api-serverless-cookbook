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
                message: "Invalid input data"
            });
        }

        // Parse request body
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data"
            });
        }

        if (!airportData.airportname || !airportData.city || !airportData.country) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data"
            });
        }

        // Ensure the ID in the path matches the body
        airportData.id = airportId;
        airportData.type = 'airport';

        const baseUrl = process.env.DATA_API_ENDPOINT;
        const username = process.env.DATA_API_USERNAME;
        const password = process.env.DATA_API_PASSWORD;

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
                },
                body: JSON.stringify(airportData),
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
                    message: "Invalid input data"
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