import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, getDocumentUrl, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig(); 

        // 2. Parse and validate input
        const airportId = event?.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid airport ID"
            });
        }

        // 3. Prepare Data API request
        const auth = buildAuthHeader(cfg.username, cfg.password);

        // Make the HTTP request using fetch
        const url = getDocumentUrl(airportId);
        
        const fetchResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': auth
            }
        });

        let responseData = await fetchResponse.text();

        // 5. Handle response and format output
        if (fetchResponse.ok) {
            try {
                const parsedData = JSON.parse(responseData);
                parsedData.id = airportId;
                responseData = JSON.stringify(parsedData);
            } catch (e) {
                console.error('Error parsing response data:', e);
                return formatError({
                    statusCode: 500,
                    message: "Error parsing response data from " + url
                });
            }

            return {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                body: responseData,
                isBase64Encoded: false
            };
        } else {
            if (fetchResponse.status === 404) {
                return formatError({
                    statusCode: 404,
                    message: "Airport does not exist"
                });
            } else if (fetchResponse.status === 400) {
                return formatError({
                    statusCode: 400,
                    message: "Invalid airport ID"
                });
            } else {
                return formatError({
                    statusCode: 500,
                    message: "Internal Server Error"
                });
            }
        }

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 