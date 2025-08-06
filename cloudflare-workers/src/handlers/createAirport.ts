import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const createAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const env = c.env;
		
		let requestBody: any;
		try {
			requestBody = await c.req.json();
		} catch (e) {
			return c.json(
				{ error: 'Invalid JSON in request body for new airport' },
				400
			);
		}
		
		// Extract airport ID from body and validate
		const { id: airportId, ...airportData } = requestBody;
		if (!airportId) {
			return c.json(
				{ error: 'Missing required attribute: id' },
				400
			);
		}
		
		const url = getDocumentUrl(env, airportId);
		
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
		
		return c.json({ message: 'Airport Created Successfully' }, 201);
	} catch (error: any) {
		console.error("Error handling POST request:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 