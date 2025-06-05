import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getQueryUrl } from '../utils/couchbase';

export const getAirportRoutes = async (c: Context) => {
	try {
		const airportCode = c.req.param('airportCode');
		const env = c.env as Env;

		if (!airportCode) {
			return new Response(
				JSON.stringify({ 
					error: 'Missing required path parameter: airportCode',
					example: '/airports/LAX/routes'
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const statement = `
			SELECT r.*
			FROM \`travel-sample\`.inventory.route r 
			WHERE r.sourceairport = ? OR r.destinationairport = ?
			ORDER BY r.sourceairport, r.destinationairport
			LIMIT 10
		`;
		
		const args = [airportCode, airportCode];
		
		const queryBody = {
			statement,
			args
		};
		
		const url = getQueryUrl(env);
		console.log(`Making query request to: ${url}`);
		console.log(`Query: ${statement}`);
		console.log(`Args: ${JSON.stringify(args)}`);
		
		const response = await fetch(url, {
			method: 'POST',
			headers: getAuthHeaders(env),
			body: JSON.stringify(queryBody)
		});
		
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`Query API Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ error: `Error executing routes query: ${response.statusText}. Detail: ${errorBody}` }),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}
		
		const data = await response.json();
		return new Response(
			JSON.stringify(data),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error("Error executing routes query:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 