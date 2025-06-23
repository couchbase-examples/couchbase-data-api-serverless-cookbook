import functions from '@google-cloud/functions-framework';
import { getDataApiConfig, getDocumentUrl } from './common.js';

functions.http('deleteAirport', async (req, res) => {
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
            method: 'DELETE',
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
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting airport data in GCP cloud function:', error);
        res.status(500).send('Error deleting airport data');
    }
}); 