import { 
    formatError, 
    formatSuccess, 
    makeCouchbaseRequest,
    COLLECTION_CONFIG,
    FTS_CONFIG
} from './utils/couchbase.js';

export const handler = async (event) => {
    try {
        const airportId = event.pathParameters?.airportId;
        const distance = event.pathParameters?.distance;
        
        if (!airportId) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport ID is required"
            });
        }
        
        if (!distance) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Distance parameter is required"
            });
        }

        // First, get the airport location
        const airportEndpoint = `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const airportResult = await makeCouchbaseRequest(airportEndpoint);
        
        if (!airportResult.success) {
            return formatError({
                statusCode: 404,
                code: "AirportNotFound",
                message: "Airport not found"
            });
        }

        let airportData;
        try {
            airportData = JSON.parse(airportResult.data);
        } catch (parseError) {
            return formatError({
                statusCode: 500,
                code: "DataParseError",
                message: "Failed to parse airport data"
            });
        }

        if (!airportData.geo || !airportData.geo.lat || !airportData.geo.lon) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport location data is not available"
            });
        }

        // Perform FTS search for nearby hotels
        const ftsQuery = {
            from: 0,
            size: 20, // Return up to 20 hotels
            query: {
                location: {
                    lon: airportData.geo.lon,
                    lat: airportData.geo.lat
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
                        "lon": airportData.geo.lon,
                        "lat": airportData.geo.lat
                    }
                }
            ],
            fields: ["*"], // Return all fields
            includeLocations: false
        };

        const ftsEndpoint = `/_p/fts/api/bucket/${COLLECTION_CONFIG.bucket}/scope/${COLLECTION_CONFIG.scope}/index/${FTS_CONFIG.indexName}/query`;
        
        const ftsResult = await makeCouchbaseRequest(ftsEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ftsQuery)
        });
        
        if (ftsResult.success) {
            const ftsData = JSON.parse(ftsResult.data);
            
            // Format the response like Cloudflare Workers
            const hotels = ftsData.hits?.map((hit) => {
                const hotel = hit.fields;
                
                return {
                    ...hotel,
                    score: hit.score
                };
            }) || [];

            const response = {
                airport: {
                    id: airportId,
                    code: airportData.faa || airportData.icao,
                    name: airportData.airportname,
                    city: airportData.city,
                    country: airportData.country,
                    coordinates: {
                        latitude: airportData.geo.lat,
                        longitude: airportData.geo.lon
                    }
                },
                search_criteria: {
                    distance
                },
                total_hotels_found: ftsData.total_hits || 0,
                hotels: hotels
            };

            return formatSuccess(response, 200);
        } else {
            // Check if it's an index not found error
            if (ftsResult.error.statusCode === 404) {
                return formatError({
                    statusCode: 404,
                    code: "IndexNotFound",
                    message: `FTS index '${FTS_CONFIG.indexName}' not found. Please create the geo-spatial FTS index first.`
                });
            }
            return formatError(ftsResult.error);
        }

    } catch (error) {
        console.error('GetHotelsNearAirport error:', error);
        return formatError({
            statusCode: 500,
            code: "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 