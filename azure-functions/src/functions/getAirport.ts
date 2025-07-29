import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, COLLECTION_CONFIG, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function getAirport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        
        context.log(`Fetching airport data from: ${url}`);
        
        // Make the HTTP request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': authHeader
            }
        });

        const responseText = await response.text();

        if (response.ok) {
            // Parse the document JSON and append the id field
            let responseJson: any;
            try {
                responseJson = JSON.parse(responseText || '{}');
            } catch (e) {
                // If parsing fails, return the raw text (unlikely) but still include id
                responseJson = { message: responseText };
            }

            const responseBodyWithId = {
                ...responseJson,
                id: airportId
            };

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'ETag': response.headers.get('etag') || undefined
                },
                body: JSON.stringify(responseBodyWithId)
            };
        } else {
            const error = handleCouchbaseError(response.status, responseText);
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

app.http('getAirport', {
    methods: ['GET'],
    route: 'airports/{airportId}',
    authLevel: 'anonymous',
    handler: getAirport
}); 