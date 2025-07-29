import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, COLLECTION_CONFIG, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function deleteAirport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Configuration validation
        const config = getConfig();
        
        // Extract airport ID from route parameters
        const airportId = request.params.airportId;
        if (!airportId) {
            return createErrorResponse(createValidationError('Airport ID is required'));
        }

        // Create Basic Auth header
        const authHeader = createAuthHeader(config.username, config.password);

        // Build the API URL
        const url = `${config.dataApiEndpoint}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        context.log(`Deleting airport document at: ${url}`);
        
        // Make the HTTP request
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': authHeader
            }
        });

        if (response.ok) {
            return {
                status: 204,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } else {
            const responseData = await response.text();
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

app.http('deleteAirport', {
    methods: ['DELETE'],
    route: 'airports/{airportId}',
    authLevel: 'anonymous',
    handler: deleteAirport
}); 