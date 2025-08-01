import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, COLLECTION_CONFIG, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function createAirport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Configuration validation
        const config = getConfig();
        
        // Get request body
        const requestBody = await request.text();
        if (!requestBody) {
            return createErrorResponse(createValidationError('Request body is required'));
        }

        // Validate JSON and extract airport ID from body
        let parsedBody: any;
        try {
            parsedBody = JSON.parse(requestBody);
        } catch (error) {
            return createErrorResponse(createValidationError('Invalid JSON in request body'));
        }

        const { id: airportId, ...airportData } = parsedBody;
        if (!airportId) {
            return createErrorResponse(createValidationError('Missing required attribute: id'));
        }

        // Create Basic Auth header
        const authHeader = createAuthHeader(config.username, config.password);

        // Build the API URL
        const url = `${config.dataApiEndpoint}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        context.log(`Creating airport document at: ${url}`);
        
        // Make the HTTP request
        const response = await fetch(url, {
            method: 'POST',
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
                status: 201,
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

app.http('createAirport', {
    methods: ['POST'],
    route: 'airports',
    authLevel: 'anonymous',
    handler: createAirport
}); 