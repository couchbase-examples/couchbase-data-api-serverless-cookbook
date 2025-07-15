import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getDocumentUrl } from '../utils/couchbase';

export const deleteAirport = async (c: Context<{ Bindings: Env }>) => {
	try {
		const documentKey = c.req.param('documentKey');
		const env = c.env;
		const url = getDocumentUrl(env, documentKey);
		
		console.log(`Making DELETE request to: ${url}`);
		const response = await fetch(url, { 
			method: 'DELETE',
			headers: getAuthHeaders(env) 
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`DELETE API Error (${response.status}): ${errorBody}`);
			return c.json(
				{ error: `Error deleting airport document: ${response.statusText}. Detail: ${errorBody}` },
				response.status as any
			);
		}
		
		return c.json({ message: `Airport document ${documentKey} deleted successfully.` });
	} catch (error: any) {
		console.error("Error handling DELETE request:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 