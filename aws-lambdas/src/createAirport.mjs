import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, getDocumentUrl, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // 1. Validate configuration
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig();

        // 2. Parse and validate input
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                message: "Invalid JSON in request body"
            });
        }

        // 2b. Extract and validate airport ID
        const airportId = airportData.id;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data or missing required id field"
            });
        }
        delete airportData.id;

        // 3. Prepare Data API request
        const auth = buildAuthHeader(cfg.username, cfg.password);
        const body = JSON.stringify(airportData);

        // 4. Execute Data API request
        const url = getDocumentUrl(airportId);
        
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            body: body
        });

        // 5. Handle response and format output
        const responseText = await fetchResponse.text();
        if (fetchResponse.ok) {
            airportData.id = airportId;
            return jsonResponse(201, airportData);
        }
        if (fetchResponse.status === 409) {
            return formatError({ statusCode: 409, message: "Airport already exists" });
        }
        if (fetchResponse.status === 403) {
            return formatError({ statusCode: 500, message: "Internal Server Error" });
        }
        if (fetchResponse.status === 400) {
            return formatError({ statusCode: 400, message: `Invalid input data: ${responseText}` });
        }
        return formatError({ statusCode: 500, message: `Internal Server Error: ${responseText}` });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({ statusCode: 500, message: "Internal Server Error: " + error.message });
    }
}; 