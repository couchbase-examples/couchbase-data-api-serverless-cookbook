import functions from '@google-cloud/functions-framework';
import { getDataApiConfig, getDocumentUrl } from './lib/common.js';

functions.http('createAirport', async (req, res) => {
    try {
        const pathParts = req.path.split('/');
        const airport_id = pathParts[pathParts.length - 1];
        
        if (!airport_id || airport_id === 'airports') {
            return res.status(400).send('airport_id path parameter is required');
        }

        if (!req.body) {
            return res.status(400).send('Request body is required');
        }

        const dapi_config = getDataApiConfig()
        const dapi_url = getDocumentUrl(airport_id)
        const auth = Buffer.from(`${dapi_config.username}:${dapi_config.password}`).toString('base64');
        
        const dapi_response = await fetch(dapi_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(req.body)
        });
        
        if (!dapi_response.ok) {
            if (dapi_response.status === 409) {
                return res.status(409).send('Airport already exists');
            }
            throw new Error(`HTTP error! status: ${dapi_response.status}`);
        }
        
        const data = await dapi_response.json().catch(() => (
            dapi_response.status === 201 ? {} : { message: 'Created successfully' }
        ));
        res.status(201).send(data);
    } catch (error) {
        console.error('Error creating airport data in GCP cloud function:', error);
        res.status(500).send('Error creating airport data');
    }
});
