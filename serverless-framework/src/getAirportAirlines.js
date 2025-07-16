import { 
    formatError, 
    formatSuccess, 
    makeCouchbaseRequest 
} from './utils/couchbase.js';

export const handler = async (event) => {
    try {
        const airportCode = event.pathParameters?.airportCode;
        if (!airportCode) {
            return formatError({
                statusCode: 400,
                code: "ValidationError",
                message: "Airport code is required"
            });
        }

        // SQL++ query to find airlines that service the airport
        const query = `
            SELECT DISTINCT r.airline
            FROM \`travel-sample\`.inventory.route r
            WHERE r.sourceairport = ? OR r.destinationairport = ?
            ORDER BY r.airline
        `;

        const endpoint = `/_p/query/query/service`;
        
        const result = await makeCouchbaseRequest(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                statement: query,
                args: [airportCode, airportCode]
            })
        });
        
        if (result.success) {
            return formatSuccess(result.data, 200);
        } else {
            return formatError(result.error);
        }

    } catch (error) {
        console.error('GetAirportAirlines error:', error);
        return formatError({
            statusCode: 500,
            code: "InternalError",
            message: error.message || "An unexpected error occurred"
        });
    }
}; 