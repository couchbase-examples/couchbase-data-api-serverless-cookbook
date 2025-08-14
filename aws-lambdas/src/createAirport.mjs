import { COLLECTION_CONFIG, validateDataApiConfig, getDataApiConfig, buildAuthHeader, formatError, jsonResponse } from './utils/common.mjs';

export const handler = async (event) => {
    try {
        // Validate DATA API config
        const cfgError = validateDataApiConfig();
        if (cfgError) return formatError(cfgError);
        const cfg = getDataApiConfig();
        const baseUrl = cfg.baseUrl;

        // Parse request body
        let airportData;
        try {
            airportData = JSON.parse(event.body || '{}');
        } catch (e) {
            return formatError({
                statusCode: 400,
                message: "Invalid JSON in request body"
            });
        }

        // Extract airport ID from request body
        const airportId = airportData.id;
        if (!airportId) {
            return formatError({
                statusCode: 400,
                message: "Invalid input data or missing required id field"
            });
        }
        delete airportData.id;

        const auth = buildAuthHeader(cfg.username, cfg.password);
        const body = JSON.stringify(airportData);

        // Make the HTTP request using fetch
        const url = `${baseUrl}/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`;
        
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: body
        });

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
            return formatError({ statusCode: 400, message: "Invalid input data or missing required id field" });
        }
        return formatError({ statusCode: 500, message: "Internal Server Error" });

    } catch (error) {
        console.error('Lambda execution error:', error);
        return formatError({
            statusCode: 500,
            message: "Internal Server Error: " + error.message
        });
    }
}; 