import https from 'https';

// Collection configuration
const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
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

        // Extract airport ID from path parameters
        const airportId = event.pathParameters?.airportId;
        if (!airportId) {
            throw new Error('Airport ID is required');
        }

        // Parse request body
        const airportData = JSON.parse(event.body || '{}');
        if (!airportData.airportname || !airportData.city || !airportData.country) {
            throw new Error('Required fields missing: airportname, city, country');
        }

        // Ensure the ID in the path matches the body
        airportData.id = airportId;
        airportData.type = 'airport';

        const baseUrl = process.env.BASE_URL;
        const username = process.env.USERNAME;
        const password = process.env.CLUSTER_PASSWORD;

        // Create Basic Auth header
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify(airportData);

        // Create the request options
        const options = {
            hostname: baseUrl.replace('https://', ''),
            path: `/v1/buckets/${COLLECTION_CONFIG.bucket}/scopes/${COLLECTION_CONFIG.scope}/collections/${COLLECTION_CONFIG.collection}/documents/${airportId}`,
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
                        resolve({
                            statusCode: res.statusCode,
                            headers: {
                                'Content-Type': 'application/json',
                                'ETag': res.headers['etag'],
                                'X-CB-MutationToken': res.headers['x-cb-mutationtoken']
                            },
                            body: JSON.stringify({
                                message: 'Airport created successfully',
                                id: airportId
                            })
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                error: res.statusCode === 409 ? 'DocumentExists' :
                                       res.statusCode === 403 ? 'InvalidAuth' :
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