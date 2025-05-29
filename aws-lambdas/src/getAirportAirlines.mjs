import https from 'https';

// Collection configuration
const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory'
};

export const handler = async (event) => {
    try {
        // Configuration validation
        if (!process.env.BASE_URL) {
            throw new Error('BASE_URL environment variable is not set');
        }
        if (!process.env.CLUSTER_PASSWORD) {
            throw new Error('CLUSTER_PASSWORD environment variable is not set');
        }
        if (!process.env.USERNAME) {
            throw new Error('USERNAME environment variable is not set');
        }

        // Parse request body
        const requestData = JSON.parse(event.body || '{}');
        const airportCode = requestData.airportCode;
        
        if (!airportCode) {
            throw new Error('Airport code is required');
        }

        const baseUrl = process.env.BASE_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

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

        // Create the request options
        const options = {
            hostname: baseUrl.replace('https://', ''),
            path: '/_p/query/query/service',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Authorization': `Basic ${auth}`
            }
        };

        // Make the HTTP request
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const queryResponse = JSON.parse(data);
                        resolve({
                            statusCode: res.statusCode,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                airlines: queryResponse.results,
                                metadata: {
                                    resultCount: queryResponse.metrics.resultCount,
                                    executionTime: queryResponse.metrics.executionTime
                                }
                            })
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                error: res.statusCode === 403 ? 'InvalidAuth' :
                                       res.statusCode === 400 ? 'InvalidArgument' : 'Internal',
                                message: data || 'An error occurred processing the request'
                            })
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(body);
            req.end();
        });

        return response;

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal',
                message: error.message
            })
        };
    }
}; 