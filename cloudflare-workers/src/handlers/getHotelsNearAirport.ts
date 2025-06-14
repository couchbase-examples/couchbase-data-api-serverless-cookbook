import { Context } from 'hono';
import { Env } from '../types/env';
import { AirportDocument } from '../types/airport';
import { HotelDocument } from '../types/hotel';
import { getAuthHeaders, getDocumentUrl, getFTSSearchUrl } from '../utils/couchbase';

// Type for FTS response
interface FTSResponse {
	hits?: Array<{
		fields: any;
		sort?: number[];
		score: number;
		locations?: any;
	}>;
	total_hits?: number;
}

export const getHotelsNearAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const airportId = c.req.param('airportId');
		const distance = c.req.param('distance');
		const env = c.env;

		// Validate input
		if (!airportId || typeof airportId !== 'string') {
			return c.json(
				{ 
					error: 'Missing required path parameters: airportId and distance are both mandatory',
					example: '/airports/airport_1254/hotels/nearby/50km'
				},
				400
			);
		}

		// Step 1: Get airport document by ID
		const documentUrl = getDocumentUrl(env, airportId);
		
		console.log(`Fetching airport data using GET: ${documentUrl}`);

		const airportResponse = await fetch(documentUrl, {
			method: 'GET',
			headers: getAuthHeaders(env)
		});

		if (!airportResponse.ok) {
			const errorBody = await airportResponse.text();
			console.error(`Airport GET API Error (${airportResponse.status}): ${errorBody}`);
			
			if (airportResponse.status === 404) {
				return c.json(
					{ 
						error: `Airport not found: ${airportId}`,
						detail: "No airport document found with the specified document ID"
					},
					404
				);
			}
			
			return c.json(
				{ 
					error: `Error fetching airport: ${airportId}`,
					detail: errorBody
				},
				airportResponse.status as any
			);
		}

		const airportData = await airportResponse.json() as AirportDocument;
		const { lat: latitude, lon: longitude } = airportData.geo;

		console.log(`Airport ${airportId} coordinates: lat=${latitude}, lon=${longitude}`);

		// Step 2: Search for nearby hotels using FTS
		const indexName = 'hotel-geo-index';
		const ftsUrl = getFTSSearchUrl(env, indexName);

		// Construct FTS geo-distance query using standard format
		const ftsQuery = {
			from: 0,
			size: 20, // Return up to 20 hotels
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
			fields: ["*"], // Return all fields
			includeLocations: false
		};

		console.log(`Making FTS geo-search request to: ${ftsUrl}`);
		console.log(`Search query:`, JSON.stringify(ftsQuery, null, 2));

		const ftsResponse = await fetch(ftsUrl, {
			method: 'POST',
			headers: getAuthHeaders(env),
			body: JSON.stringify(ftsQuery)
		});

		if (!ftsResponse.ok) {
			const errorBody = await ftsResponse.text();
			console.error(`FTS API Error (${ftsResponse.status}): ${errorBody}`);
			return c.json(
				{ 
					error: `Error searching for nearby hotels: ${ftsResponse.statusText}`,
					detail: errorBody,
					note: "Make sure the 'hotel-geo-index' FTS index exists with geo mapping for the 'geo' field"
				},
				ftsResponse.status as any
			);
		}

		const ftsData = await ftsResponse.json() as FTSResponse;

		// Format the response
		const hotels = ftsData.hits?.map((hit, index) => {
			const hotel = hit.fields as HotelDocument;
			
			return {
				...hotel,
				score: hit.score
			};
		}) || [];

		return c.json({
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
		});

	} catch (error: any) {
		console.error("Error in airport hotel search:", error);
		return c.json(
			{ 
				error: error.message,
				note: "This endpoint requires a Full Text Search index with geo-spatial mapping"
			},
			500
		);
	}
}; 