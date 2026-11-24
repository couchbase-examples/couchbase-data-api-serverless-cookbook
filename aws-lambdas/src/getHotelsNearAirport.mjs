import { COLLECTION_CONFIG, validateDataApiConfig, dataApiFetch, getDocumentUrl, getFTSSearchUrl, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);

        // 2. Parse and validate input
        const airportId = event.pathParameters?.airportId;
        const distance = event.pathParameters?.distance || "5km";

        if (!airportId) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport ID is required as a path parameter"
            });
        }

        // 3. Execute Data API requests
        const airportUrl = getDocumentUrl(airportId);
        
        const airportFetchResponse = await dataApiFetch(airportUrl, { method: 'GET' });

        if (!airportFetchResponse.ok) {
            return formatError({
                statusCode: airportFetchResponse.status,
                code: airportFetchResponse.status === 404 ? 'DocumentNotFound' : 'InternalError',
                message: `Error fetching airport: ${await airportFetchResponse.text()}`
            });
        }

        const airportResponse = await airportFetchResponse.json();
        const { lat: latitude, lon: longitude } = airportResponse.geo;

        // 3b. Execute FTS request
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

        const ftsUrl = getFTSSearchUrl('hotel-geo-index');
        
        const ftsFetchResponse = await dataApiFetch(ftsUrl, { method: 'POST', body: body });

        // 4. Handle response and format output
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
