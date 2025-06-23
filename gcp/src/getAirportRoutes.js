import functions from '@google-cloud/functions-framework';
import { getDataApiConfig, getQueryUrl } from './common.js';

functions.http('getAirportRoutes', async (req, res) => {
    try {
        const pathParts = req.path.split('/');
        const airportCode = pathParts[pathParts.length - 2];
        
        if (!airportCode || airportCode === 'airports') {
            return res.status(400).json({ error: 'Airport code path parameter is required' });
        }

        const statement = `
            SELECT r.*
            FROM \`travel-sample\`.inventory.route r 
            WHERE r.sourceairport = ? OR r.destinationairport = ?
            ORDER BY r.sourceairport, r.destinationairport
            LIMIT 10
        `;
        
        const args = [airportCode, airportCode];
        
        const queryBody = {
            statement,
            args
        };
        
        const dapi_config = getDataApiConfig();
        const url = getQueryUrl();
        const auth = Buffer.from(`${dapi_config.username}:${dapi_config.password}`).toString('base64');
        
        console.log(`Making query request to: ${url}`);
        console.log(`Query: ${statement}`);
        console.log(`Args: ${JSON.stringify(args)}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(queryBody)
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Query API Error (${response.status}): ${errorBody}`);
            return res.status(response.status).json({ 
                error: `Error executing routes query: ${response.statusText}. Detail: ${errorBody}` 
            });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error executing routes query in GCP cloud function:', error);
        res.status(500).json({ error: 'Error executing routes query' });
    }
}); 