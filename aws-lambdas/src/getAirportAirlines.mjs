import { COLLECTION_CONFIG, validateDataApiConfig, dataApiFetch, getQueryUrl, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);

        // 2. Parse and validate input
        const airportCode = event.pathParameters?.airportCode;
        if (!airportCode) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport code is required as a path parameter"
            });
        }

        // Create query
        const queryBody = {
            statement: `
                SELECT DISTINCT r.airline
                FROM \`${COLLECTION_CONFIG.bucket}\`.\`${COLLECTION_CONFIG.scope}\`.route r 
                WHERE r.sourceairport = ? OR r.destinationairport = ?
                ORDER BY r.airline
            `,
            args: [airportCode, airportCode]
        };

        const body = JSON.stringify(queryBody);

        // 3. Execute Data API request
        const url = getQueryUrl();
        
        const fetchResponse = await dataApiFetch(url, { method: 'POST', body: body });

        const responseData = await fetchResponse.text();
        // 4. Handle response and format output
        if (fetchResponse.ok) {
            const queryResponse = JSON.parse(responseData);
            return jsonResponse(200, {
                airlines: queryResponse.results,
                metadata: {
                    resultCount: queryResponse.metrics.resultCount,
                    executionTime: queryResponse.metrics.executionTime
                }
            });
        }
        return formatError({ statusCode: fetchResponse.status, message: responseData || 'An error occurred processing the request' });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 