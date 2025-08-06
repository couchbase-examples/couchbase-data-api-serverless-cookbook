import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const getAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const airportId = c.req.param('airportId');
		const env = c.env;
		const url = getDocumentUrl(env, airportId);
		
		console.log(`Making GET request to: ${url}`);
		const response = await fetch(url, { 
			method: 'GET',
			headers: getAuthHeaders(env) 
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`GET API Error (${response.status}): ${errorBody}`);
			return c.json(
				{ error: `Error fetching airport data: ${response.statusText}. Detail: ${errorBody}` },
				response.status as any
			);
		}
		
		const data = await response.json() as any;
		
		// Add the airport ID to the response body
		const responseWithId = {
			...data,
			id: airportId
		};
		
		return c.json(responseWithId);
	} catch (error: any) {
		console.error("Error handling GET request:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 