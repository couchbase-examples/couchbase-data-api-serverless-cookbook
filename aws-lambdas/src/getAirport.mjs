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
            "Content-Type": "application/json"
        },
        isBase64Encoded: false,
        body: JSON.stringify({
            error: error.message
        })
    };
};

// Helper function to build query parameters
const buildQueryParams = (fields = DOCUMENT_FIELDS.default) => {
    return fields.length > 0 ? `?fields=${fields.join(',')}` : '';
};

export const handler = async (event) => {
    try {
        // Configuration validation
        if (!process.env.DATA_API_URL) {
            return formatError({
                statusCode: 500,
                message: "Internal Server Error"
            });
        }
        if (!process.env.CLUSTER_PASSWORD) {
            return formatError({
                statusCode: 500,
                message: "Internal Server Error"
            });
        }
        if (!process.env.USERNAME) {
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

        const baseUrl = process.env.DATA_API_URL;
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
                    'etag': fetchResponse.headers.get('etag')
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