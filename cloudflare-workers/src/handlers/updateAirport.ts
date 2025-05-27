import { Context } from 'hono';
import { AirportDocument } from '../types/airport';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const updateAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const documentKey = c.req.param('documentKey');
		
		let airportData: AirportDocument;
		try {
			airportData = await c.req.json<AirportDocument>();
		} catch (e) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body for airport update' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const url = getDocumentUrl(c.env, documentKey);
		
		console.log(`Making PUT request to: ${url}`);
		const response = await fetch(url, {
			method: 'PUT',
			headers: getAuthHeaders(c.env),
			body: JSON.stringify(airportData),
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`PUT API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error updating airport document: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const responseData = await response.json().catch(() => (response.status === 204 ? {} : { message: 'Updated' }));
		return new Response(
			JSON.stringify(responseData),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error handling PUT request:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 