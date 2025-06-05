import { Context } from 'hono';
import { AirportDocument } from '../types/airport';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const createAirport = async (c: Context) => {
	try {
		const documentKey = c.req.param('documentKey');
		const env = c.env as Env;
		
		let airportData: AirportDocument;
		try {
			airportData = await c.req.json<AirportDocument>();
		} catch (e) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body for new airport' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const url = getDocumentUrl(env, documentKey);
		
		console.log(`Making POST request to: ${url}`);
		const response = await fetch(url, {
			method: 'POST',
			headers: getAuthHeaders(env),
			body: JSON.stringify(airportData),
		});
		
		if (!response.ok && response.status !== 201) {
			const errorBody = await response.text();
			console.error(`POST API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error creating airport document: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const responseData = await response.json().catch(() => ({}));
		return new Response(
			JSON.stringify(responseData),
			{ status: 201, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error handling POST request:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 