import { COLLECTION_CONFIG, validateDataApiConfig, dataApiFetch, getDocumentUrl, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);

        // 2. Parse and validate input
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid airport ID"
            });
        }

        // 3. Execute Data API request
        const url = getDocumentUrl(airportId);
        
        const fetchResponse = await dataApiFetch(url, { method: 'DELETE' });

        const responseData = await fetchResponse.text();

        // 4. Handle response and format output
        if (fetchResponse.ok) return { statusCode: 204, body: '', isBase64Encoded: false };
        if (fetchResponse.status === 404) return formatError({ statusCode: 404, message: "Airport does not exist" });
        if (fetchResponse.status === 400) return formatError({ statusCode: 400, message: "Invalid airport ID" });
        return formatError({ statusCode: 500, message: "Internal Server Error" });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 