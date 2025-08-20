import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, getDocumentUrl, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig();

        // 2. Parse and validate input
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid airport ID"
            });
        }

        // 3. Prepare Data API request
        const auth = buildAuthHeader(cfg.username, cfg.password);

        // 4. Execute Data API request
        const url = getDocumentUrl(airportId);
        
        const fetchResponse = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': auth
            }
        });

        const responseData = await fetchResponse.text();

        // 5. Handle response and format output
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