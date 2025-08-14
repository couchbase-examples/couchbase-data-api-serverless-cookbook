import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig();
        const baseUrl = cfg.baseUrl;

        // Get parameters from path parameters
        const airportCode = event.pathParameters?.airportCode;
        if (!airportCode) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport code is required as a path parameter"
            });
        }

        const auth = buildAuthHeader(cfg.username, cfg.password);

        // Create query
        const queryBody = {
            statement: `
                SELECT r.*
                FROM \`${COLLECTION_CONFIG.bucket}\`.\`${COLLECTION_CONFIG.scope}\`.route r 
                WHERE r.sourceairport = ? OR r.destinationairport = ?
                ORDER BY r.sourceairport, r.destinationairport
                LIMIT 10
            `,
            args: [airportCode, airportCode]
        };

        const body = JSON.stringify(queryBody);

        // Make the HTTP request using fetch
        const url = `${baseUrl}/_p/query/query/service`;
        
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

        const responseData = await fetchResponse.text();
        if (fetchResponse.ok) {
            const queryResponse = JSON.parse(responseData);
            return jsonResponse(200, {
                routes: queryResponse.results,
                metadata: {
                    resultCount: queryResponse.metrics.resultCount,
                    executionTime: queryResponse.metrics.executionTime
                }
            });
        }
        const errorCode = fetchResponse.status === 403 ? 'InvalidAuth' : fetchResponse.status === 400 ? 'InvalidArgument' : 'InternalError';
        return formatError({ statusCode: fetchResponse.status, code: errorCode, message: responseData || 'An error occurred processing the request' });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 