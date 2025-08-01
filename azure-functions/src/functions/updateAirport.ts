import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, COLLECTION_CONFIG, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function updateAirport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Configuration validation
        const config = getConfig();
        
        // Extract airport ID from route parameters
        const airportId = request.params.airportId;
        if (!airportId) {
            return createErrorResponse(createValidationError('Airport ID is required'));
        }

        // Get request body
        const requestBody = await request.text();
        if (!requestBody) {
            return createErrorResponse(createValidationError('Request body is required'));
        }

        // Validate JSON
        let airportData;
        try {
            airportData = JSON.parse(requestBody);
        } catch (error) {
            return createErrorResponse(createValidationError('Invalid JSON in request body'));
        }

        // Create Basic Auth header
        const authHeader = createAuthHeader(config.username, config.password);

        // Build the API URL
        const url = `${config.dataApiEndpoint}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        context.log(`Updating airport document at: ${url}`);
        
        // Make the HTTP request
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(airportData)
        });

        const responseData = await response.text();

        if (response.ok) {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'ETag': response.headers.get('etag') || undefined
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

app.http('updateAirport', {
    methods: ['PUT'],
    route: 'airports/{airportId}',
    authLevel: 'anonymous',
    handler: updateAirport
}); 