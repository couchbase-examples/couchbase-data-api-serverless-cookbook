import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, COLLECTION_CONFIG, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function getHotelsNearAirport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Configuration validation
        const config = getConfig();
        
        // Extract parameters from route
        const airportId = request.params.airportId;
        const distance = request.params.distance;
        
        if (!airportId) {
            return createErrorResponse(createValidationError('Airport ID is required'));
        }
        
        if (!distance) {
            return createErrorResponse(createValidationError('Distance is required'));
        }

        // Validate distance format (e.g., "10km", "5mi")
        const distanceRegex = /^(\d+(?:\.\d+)?)(km|mi)$/;
        if (!distanceRegex.test(distance)) {
            return createErrorResponse(createValidationError('Distance must be in format "10km" or "5mi"'));
        }

        // Create Basic Auth header
        const authHeader = createAuthHeader(config.username, config.password);

        // First, get the airport document to retrieve its geo coordinates
        const airportUrl = `${config.dataApiEndpoint}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        context.log(`Fetching airport geo data from: ${airportUrl}`);
        
        const airportResponse = await fetch(airportUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': authHeader
            }
        });

        if (!airportResponse.ok) {
            const errorData = await airportResponse.text();
            const error = handleCouchbaseError(airportResponse.status, errorData);
            return createErrorResponse(error);
        }

        const airportData = await airportResponse.json();
        
        if (!airportData.geo || !airportData.geo.lat || !airportData.geo.lon) {
            return createErrorResponse(createValidationError('Airport geo coordinates not found'));
        }

        // Build the FTS query to find hotels near the airport (matching Cloudflare Workers)
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

        // Build the API URL for FTS search (matching Cloudflare Workers)
        const ftsUrl = `${config.dataApiEndpoint}/_p/fts/api/bucket/${COLLECTION_CONFIG.bucket}/scope/${COLLECTION_CONFIG.scope}/index/hotel-geo-index/query`;
        
        context.log(`Searching for hotels near airport ${airportId} within ${distance}`);
        context.log(`FTS URL: ${ftsUrl}`);
        
        // Make the FTS search request
        const response = await fetch(ftsUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(ftsQuery)
        });

        const responseData = await response.text();

        if (response.ok) {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: responseData
            };
        } else {
            const error = handleCouchbaseError(response.status, responseData);
            return createErrorResponse(error);
        }

    } catch (error) {
        context.error('Function execution error:', error);
        
        if (error.message.includes('Missing required environment variables')) {
            return createErrorResponse(createConfigurationError(error.message));
        }
        
        return createErrorResponse({
            statusCode: 500,
            code: 'InternalError',
            message: 'An unexpected error occurred'
        });
    }
}

app.http('getHotelsNearAirport', {
    methods: ['GET'],
    route: 'airports/{airportId}/hotels/nearby/{distance}',
    authLevel: 'anonymous',
    handler: getHotelsNearAirport
}); 