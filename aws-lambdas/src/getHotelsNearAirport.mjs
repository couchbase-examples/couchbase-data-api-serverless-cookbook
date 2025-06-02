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
        
        const airportId = requestData.airportId;
        const distance = requestData.distance || "5km";

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

        // Step 1: Get airport document
        const airportResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(baseUrl).hostname,
                path: `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject({
                            statusCode: res.statusCode,
                            code: res.statusCode === 404 ? 'DocumentNotFound' : 'InternalError',
                            message: `Error fetching airport: ${data}`
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject({ statusCode: 500, code: "NetworkError", message: error.message });
            });

            req.end();
        });

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

        const ftsResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(baseUrl).hostname,
                path: `/_p/fts/api/bucket/${COLLECTION_CONFIG.bucket}/scope/${COLLECTION_CONFIG.scope}/index/hotel-geo-index/query`,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'Authorization': `Basic ${auth}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject({
                            statusCode: res.statusCode,
                            code: 'FTSError',
                            message: `Error searching for hotels: ${data}`
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject({ statusCode: 500, code: "NetworkError", message: error.message });
            });

            req.write(body);
            req.end();
        });

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
            statusCode: error.statusCode || 500,
            code: error.code || "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
};
