import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getQueryUrl } from '../utils/couchbase';

export const getAirportAirlines = async (c: Context<{ Bindings: Env }>) => {
	try {
		let requestBody: { airportCode: string };
		
		try {
			requestBody = await c.req.json();
		} catch (e) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (!requestBody.airportCode) {
			return new Response(
				JSON.stringify({ error: 'Missing required field: airportCode' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const statement = `
			SELECT DISTINCT r.airline
			FROM \`travel-sample\`.inventory.route r 
			WHERE r.sourceairport = ? OR r.destinationairport = ?
			ORDER BY r.airline
		`;
		
		const args = [requestBody.airportCode, requestBody.airportCode];
		
		const queryBody = {
			statement,
			args
		};
		
		const url = getQueryUrl(c.env);
		console.log(`Making query request to: ${url}`);
		console.log(`Query: ${statement}`);
		console.log(`Args: ${JSON.stringify(args)}`);
		
		const response = await fetch(url, {
			method: 'POST',
			headers: getAuthHeaders(c.env),
			body: JSON.stringify(queryBody)
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`Query API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error executing airlines query: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const data = await response.json();
		return new Response(
			JSON.stringify(data),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error executing airlines query:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 