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
                message: "DATA_API_ENDPOINT environment variable is not set"
            });
        }
        if (!process.env.DATA_API_PASSWORD) {
            return formatError({
                statusCode: 500,
                message: "DATA_API_PASSWORD environment variable is not set"
            });
        }
        if (!process.env.DATA_API_USERNAME) {
            return formatError({
                statusCode: 500,
                message: "DATA_API_USERNAME environment variable is not set"
            });
        }

        // Parse request body
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                message: "Invalid JSON in request body"
            });
        }

        // Extract airport ID from request body
        const airportId = airportData.id;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data or missing required id field"
            });
        }
        delete airportData.id;

        const baseUrl = process.env.DATA_API_ENDPOINT;
        const username = process.env.DATA_API_USERNAME;
        const password = process.env.DATA_API_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify(airportData);

        // Make the HTTP request using fetch
        const url = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

        if (fetchResponse.ok) {
            airportData.id = airportId;
            return {
                statusCode: 201,
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(airportData),
                isBase64Encoded: false
            };
        } else {
            if (fetchResponse.status === 409) {
                return formatError({
                    statusCode: 409,
                    message: "Airport already exists"
                });
            } else if (fetchResponse.status === 403) {
                return formatError({
                    statusCode: 500,
                    message: "Internal Server Error"
                });
            } else if (fetchResponse.status === 400) {
                return formatError({
                    statusCode: 400,
                    message: "Invalid input data or missing required id field"
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
            message: "Internal Server Error: " + error.message
        });
    }
}; 