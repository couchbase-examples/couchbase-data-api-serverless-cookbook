import functions from '@google-cloud/functions-framework';
import { getDataApiConfig, getFTSSearchUrl } from './common.js';

functions.http('getHotelsNearAirport', async (req, res) => {
    try {
        const pathParts = req.path.split('/');
        const airportId = pathParts[2]; 
        const distance = pathParts[5] || "5km"; 
        
        if (!airportId || airportId === 'airports') {
            return res.status(400).json({
                error: "Airport ID is required as a path parameter"
            });
        }

        const dapi_config = getDataApiConfig();
        const auth = Buffer.from(`${dapi_config.username}:${dapi_config.password}`).toString('base64');

        // Step 1: Get airport document
        const airportUrl = `https://${dapi_config.endpoint}/v1/buckets/${dapi_config.bucketName}/scopes/${dapi_config.scope}/collections/${dapi_config.collection}/documents/${airportId}`;
        
        const airportResponse = await fetch(airportUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });

        if (!airportResponse.ok) {
            if (airportResponse.status === 404) {
                return res.status(404).json({ error: 'Airport not found' });
            }
            throw new Error(`Airport API error! status: ${airportResponse.status}`);
        }

        const airportData = await airportResponse.json();
        const { lat: latitude, lon: longitude } = airportData.geo;

        // Step 2: Search for nearby hotels using FTS
        const ftsQuery = {
            from: 0,
            size: 20,
            query: {
                location: {
                    lon: longitude,
                    lat: latitude
                },
                distance: distance,
                field: "geo"
            },
            sort: [
                {
                    "by": "geo_distance",
                    "field": "geo",
                    "unit": "km",
                    "location": {
                        "lon": longitude,
                        "lat": latitude
                    }
                }
            ],
            fields: ["*"],
            includeLocations: false
        };

        const ftsUrl = getFTSSearchUrl('hotel-geo-index');
        
        const ftsResponse = await fetch(ftsUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(ftsQuery)
        });

        if (!ftsResponse.ok) {
            const errorBody = await ftsResponse.text();
            console.error(`FTS API Error (${ftsResponse.status}): ${errorBody}`);
            return res.status(ftsResponse.status).json({ 
                error: `Error: ${ftsResponse.statusText}. Detail: ${errorBody}` 
            });
        }

        const ftsData = await ftsResponse.json();

        // Format the response
        const hotels = ftsData.hits?.map(hit => ({
            ...hit.fields,
            score: hit.score
        })) || [];

        const responseData = {
            airport: {
                id: airportId,
                code: airportData.faa || airportData.icao,
                name: airportData.airportname,
                city: airportData.city,
                country: airportData.country,
                coordinates: {
                    latitude,
                    longitude
                }
            },
            search_criteria: {
                distance
            },
            total_hotels_found: ftsData.total_hits || 0,
            hotels: hotels
        };

        res.json(responseData);

    } catch (error) {
        console.error('Error in getHotelsNearAirport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 