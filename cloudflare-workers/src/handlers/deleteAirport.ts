import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const deleteAirport = async (c: Context) => {
	try {
		const documentKey = c.req.param('documentKey');
		const env = c.env as Env;
		const url = getDocumentUrl(env, documentKey);
		
		console.log(`Making DELETE request to: ${url}`);
		const response = await fetch(url, {
			method: 'DELETE',
			headers: getAuthHeaders(env),
		});
		
		if (!response.ok && response.status !== 204) {
			const errorBody = await response.text();
			console.error(`DELETE API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error deleting airport document: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		if (response.status === 204) {
			return new Response(null, { status: 204 });
		}
		
		return new Response(
			JSON.stringify({ message: `Airport document ${documentKey} deleted successfully.` }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error handling DELETE request:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 