import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, getDocumentUrl, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig();
        const baseUrl = cfg.baseUrl;

        // 2. Parse and validate input
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data"
            });
        }

        // 2b. Parse request body
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data"
            });
        }

        if (!airportData.airportname || !airportData.city || !airportData.country) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data"
            });
        }

        // 2c. Normalize request body
        airportData.id = airportId;
        airportData.type = 'airport';

        // 3. Prepare Data API request
        const auth = buildAuthHeader(cfg.username, cfg.password);
        const body = JSON.stringify(airportData);

        // 4. Execute Data API request
        const url = getDocumentUrl(airportId);
        
        const fetchResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            body: body
        });

        const responseData = await fetchResponse.text();

        // 5. Handle response and format output
        if (fetchResponse.ok) return jsonResponse(200, airportData);
        if (fetchResponse.status === 404) return formatError({ statusCode: 404, message: "Airport does not exist" });
        if (fetchResponse.status === 400) return formatError({ statusCode: 400, message: "Invalid input data" });
        return formatError({ statusCode: 500, message: "Internal Server Error" });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
}; 