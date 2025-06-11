import { Context } from 'hono';
import { AirportDocument } from '../types/airport';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const createAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const documentKey = c.req.param('documentKey');
		const env = c.env;
		
		let airportData: AirportDocument;
		try {
			airportData = await c.req.json<AirportDocument>();
		} catch (e) {
			return c.json(
				{ error: 'Invalid JSON in request body for new airport' },
				400
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
			return c.json(
				{ error: `Error creating airport document: ${response.statusText}. Detail: ${errorBody}` },
				response.status as any
			);
		}
		
		const responseData = await response.json().catch(() => ({})) as any;
		return c.json(responseData, 201);
	} catch (error: any) {
		console.error("Error handling POST request:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 