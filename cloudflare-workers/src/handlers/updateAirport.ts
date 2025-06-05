import { Context } from 'hono';
import { AirportDocument } from '../types/airport';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const updateAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const documentKey = c.req.param('documentKey');
		const env = c.env;
		
		let airportData: AirportDocument;
		try {
			airportData = await c.req.json<AirportDocument>();
		} catch (e) {
			return c.json(
				{ error: 'Invalid JSON in request body for airport update' },
				400
			);
		}
		
		const url = getDocumentUrl(env, documentKey);
		
		console.log(`Making PUT request to: ${url}`);
		const response = await fetch(url, {
			method: 'PUT',
			headers: getAuthHeaders(env),
			body: JSON.stringify(airportData),
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`PUT API Error (${response.status}): ${errorBody}`);
			return c.json(
				{ error: `Error updating airport document: ${response.statusText}. Detail: ${errorBody}` },
				response.status as any
			);
		}
		
		const responseData = await response.json().catch(() => ({})) as any;
		return c.json(responseData);
	} catch (error: any) {
		console.error("Error handling PUT request:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 