import functions from '@google-cloud/functions-framework';
import axios from 'axios';
import { getDataApiConfig, getDocumentUrl } from '../lib/couchbase.js';

functions.http('updateAirport', async (req, res) => {
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
        
        const dapi_response = await axios.put(dapi_url, req.body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        })
        
        res.status(200).send(dapi_response.data);
    } catch (error) {
        console.error('Error updating airport data in GCP cloud function:', error);
        if (error.response && error.response.status === 404) {
            res.status(404).send('Airport not found');
        } else {
            res.status(500).send('Error updating airport data');
        }
    }
}); 