import functions from '@google-cloud/functions-framework';
import axios from 'axios';
import { getDataApiConfig, getQueryUrl } from '../lib/couchbase.js';

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
        
        const response = await axios.post(url, queryBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error executing routes query in GCP cloud function:', error);
        
        if (error.response) {
            const errorBody = error.response.data;
            console.error(`Query API Error (${error.response.status}): ${JSON.stringify(errorBody)}`);
            return res.status(error.response.status).json({ 
                error: `Error executing routes query: ${error.response.statusText}. Detail: ${JSON.stringify(errorBody)}` 
            });
        }
        
        res.status(500).json({ error: 'Error executing routes query' });
    }
}); 