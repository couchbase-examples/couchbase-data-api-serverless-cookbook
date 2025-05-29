import { Context } from 'hono';
import { Env } from '../types/env';
import { AirportDocument } from '../types/airport';
import { HotelDocument } from '../types/hotel';
import { getAuthHeaders, getQueryUrl, getFTSSearchUrl } from '../utils/couchbase';

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

// Type for N1QL query response
interface N1QLResponse<T> {
	results?: T[];
	status: string;
	metrics?: any;
}

export const getHotelsNearAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { airportCode, distance = "5km" } = body;

		// Validate input
		if (!airportCode || typeof airportCode !== 'string') {
			return new Response(
				JSON.stringify({ 
					error: 'Invalid input. Airport code is required.',
					example: {
						airportCode: "SFO",
						distance: "5km"
					}
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Step 1: Find airport by airport code using N1QL query
		const airportQuery = `
			SELECT a.*
			FROM \`travel-sample\`.inventory.airport a 
			WHERE a.faa = ? OR a.icao = ?
			LIMIT 1
		`;
		
		const airportArgs = [airportCode.toUpperCase(), airportCode.toUpperCase()];
		
		const airportQueryBody = {
			statement: airportQuery,
			args: airportArgs
		};
		
		const queryUrl = getQueryUrl(c.env);
		console.log(`Fetching airport data using N1QL query: ${airportQuery}`);
		console.log(`Args: ${JSON.stringify(airportArgs)}`);

		const airportResponse = await fetch(queryUrl, {
			method: 'POST',
			headers: getAuthHeaders(c.env),
			body: JSON.stringify(airportQueryBody)
		});

		if (!airportResponse.ok) {
			const errorBody = await airportResponse.text();
			console.error(`Airport Query API Error (${airportResponse.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ 
					error: `Error searching for airport: ${airportCode}`,
					detail: errorBody
				}),
				{ status: airportResponse.status, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const airportQueryResult = await airportResponse.json() as N1QLResponse<AirportDocument>;
		
		if (!airportQueryResult.results || airportQueryResult.results.length === 0) {
			return new Response(
				JSON.stringify({ 
					error: `Airport not found: ${airportCode}`,
					detail: "No airport found with the specified FAA or ICAO code"
				}),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const airportData = airportQueryResult.results[0] as AirportDocument;
		const { lat: latitude, lon: longitude } = airportData.geo;

		console.log(`Airport ${airportCode} coordinates: lat=${latitude}, lon=${longitude}`);

		// Step 2: Search for nearby hotels using FTS
		const indexName = 'hotel-geo-index';
		const ftsUrl = getFTSSearchUrl(c.env, indexName);

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
					"unit": "mi",
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
			headers: getAuthHeaders(c.env),
			body: JSON.stringify(ftsQuery)
		});

		if (!ftsResponse.ok) {
			const errorBody = await ftsResponse.text();
			console.error(`FTS API Error (${ftsResponse.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ 
					error: `Error searching for nearby hotels: ${ftsResponse.statusText}`,
					detail: errorBody,
					note: "Make sure the 'hotel-geo-index' FTS index exists with geo mapping for the 'geo' field"
				}),
				{ status: ftsResponse.status, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const ftsData = await ftsResponse.json() as FTSResponse;

		// Format the response to include distance information
		const hotels = ftsData.hits?.map((hit, index) => {
			const hotel = hit.fields as HotelDocument;
			
			// Extract distance from FTS sort (should now be numeric, in miles)
			let distanceMi: number = 0;
			if (hit.sort && Array.isArray(hit.sort) && hit.sort.length > 0) {
				const sortValue = hit.sort[0];
				if (typeof sortValue === 'number') {
					distanceMi = Math.round(sortValue * 100) / 100; // Round to 2 decimal places
				} else {
					// Log if still getting non-numeric values
					console.warn(`Unexpected sort value type for hotel ${hotel.name}:`, typeof sortValue, sortValue);
					distanceMi = 0;
				}
			}
			
			return {
				...hotel,
				distance_mi: distanceMi,
				score: hit.score
			};
		}) || [];

		return new Response(
			JSON.stringify({
				airport: {
					code: airportCode.toUpperCase(),
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
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);

	} catch (error: any) {
		console.error("Error in airport hotel search:", error);
		return new Response(
			JSON.stringify({ 
				error: error.message,
				note: "This endpoint requires a Full Text Search index with geo-spatial mapping"
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 