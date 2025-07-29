import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConfig, createAuthHeader } from '../utils/config';
import { createErrorResponse, handleCouchbaseError, createValidationError, createConfigurationError } from '../utils/errors';

export async function getAirportAirlines(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Configuration validation
        const config = getConfig();
        
        // Extract airport code from route parameters
        const airportCode = request.params.airportCode;
        if (!airportCode) {
            return createErrorResponse(createValidationError('Airport code is required'));
        }

        // Create Basic Auth header
        const authHeader = createAuthHeader(config.username, config.password);

        // Build the N1QL query to find airlines that service the airport (matching Cloudflare Workers)
        const statement = `
            SELECT DISTINCT r.airline
            FROM \`travel-sample\`.inventory.route r 
            WHERE r.sourceairport = ? OR r.destinationairport = ?
            ORDER BY r.airline
        `;

        // Build the API URL for query (matching Cloudflare Workers)
        const url = `${config.dataApiEndpoint}/_p/query/query/service`;
        
        context.log(`Querying airlines for airport: ${airportCode}`);
        context.log(`Query URL: ${url}`);
        
        // Make the HTTP request (matching Cloudflare Workers format)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                statement,
                args: [airportCode, airportCode]
            })
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

app.http('getAirportAirlines', {
    methods: ['GET'],
    route: 'airports/{airportCode}/airlines',
    authLevel: 'anonymous',
    handler: getAirportAirlines
}); 