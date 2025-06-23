import functions from '@google-cloud/functions-framework';
import { getDataApiConfig, getDocumentUrl } from './common.js';

functions.http('getAirport', async (req, res) => {
    try {
        const pathParts = req.path.split('/');
        const airport_id = pathParts[pathParts.length - 1];
        
        if (!airport_id || airport_id === 'airports') {
            return res.status(400).send('airport_id path parameter is required');
        }
        
        const dapi_config = getDataApiConfig()
        const dapi_url = getDocumentUrl(airport_id)
        const auth = Buffer.from(`${dapi_config.username}:${dapi_config.password}`).toString('base64');
        const dapi_response = await fetch(dapi_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });
        
        if (!dapi_response.ok) {
            if (dapi_response.status === 404) {
                return res.status(404).send('Airport not found');
            }
            throw new Error(`HTTP error! status: ${dapi_response.status}`);
        }
        
        const data = await dapi_response.json();
        res.status(200).send(data);
    } catch (error) {
        console.error('Error fetching airport data from GCP cloud run:', error);
        res.status(500).send('Error fetching airport data');
    }
});