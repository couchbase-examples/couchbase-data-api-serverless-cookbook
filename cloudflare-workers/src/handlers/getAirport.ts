import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const getAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const documentKey = c.req.param('documentKey');
		const url = getDocumentUrl(c.env, documentKey);
		
		console.log(`Making GET request to: ${url}`);
		const response = await fetch(url, { 
			method: 'GET',
			headers: getAuthHeaders(c.env) 
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`GET API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error fetching airport data: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const data = await response.json();
		return new Response(
			JSON.stringify(data),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error handling GET request:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 