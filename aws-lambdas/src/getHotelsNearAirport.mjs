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
        const airportId = event.pathParameters?.airportId;
        const distance = event.pathParameters?.distance || "5km";

        if (!airportId) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport ID is required as a path parameter"
            });
        }

        const baseUrl = process.env.DATA_API_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        // Step 1: Get airport document
        const airportUrl = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const airportFetchResponse = await fetch(airportUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });

        if (!airportFetchResponse.ok) {
            return formatError({
                statusCode: airportFetchResponse.status,
                code: airportFetchResponse.status === 404 ? 'DocumentNotFound' : 'InternalError',
                message: `Error fetching airport: ${await airportFetchResponse.text()}`
            });
        }

        const airportResponse = await airportFetchResponse.json();
        const { lat: latitude, lon: longitude } = airportResponse.geo;

        // Step 2: Search for nearby hotels using FTS
        const ftsQuery = {
            from: 0,
            size: 20,
            query: {
                location: {
                    lon: longitude,
                    lat: latitude
                },
                distance: distance,
                field: "geo"
            },
            sort: [
                {
                    "by": "geo_distance",
                    "field": "geo",
                    "unit": "km",
                    "location": {
                        "lon": longitude,
                        "lat": latitude
                    }
                }
            ],
            fields: ["*"],
            includeLocations: false
        };

        const body = JSON.stringify(ftsQuery);

        const ftsUrl = `${baseUrl}/_p/fts/api/bucket/${COLLECTION_CONFIG.bucket}/scope/${COLLECTION_CONFIG.scope}/index/hotel-geo-index/query`;
        
        const ftsFetchResponse = await fetch(ftsUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

        if (!ftsFetchResponse.ok) {
            return formatError({
                statusCode: ftsFetchResponse.status,
                code: 'FTSError',
                message: `Error searching for hotels: ${await ftsFetchResponse.text()}`
            });
        }

        const ftsResponse = await ftsFetchResponse.json();

        // Format the response
        const hotels = ftsResponse.hits?.map(hit => ({
            ...hit.fields,
            score: hit.score
        })) || [];

        return {
            statusCode: 200,
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                airport: {
                    id: airportId,
                    code: airportResponse.faa || airportResponse.icao,
                    name: airportResponse.airportname,
                    city: airportResponse.city,
                    country: airportResponse.country,
                    coordinates: {
                        latitude,
                        longitude
                    }
                },
                search_criteria: {
                    distance
                },
                total_hotels_found: ftsResponse.total_hits || 0,
                hotels: hotels
            }),
            isBase64Encoded: false
        };

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
};
