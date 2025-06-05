import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getQueryUrl } from '../utils/couchbase';

export const getAirportAirlines = async (c: Context<{ Bindings: Env }>) => {
	try {
		const airportCode = c.req.param('airportCode');
		const env = c.env;
		
		if (!airportCode) {
			return c.json(
				{ 
					error: 'Missing required path parameter: airportCode',
					example: '/airports/LAX/airlines'
				},
				400
			);
		}

		const statement = `
			SELECT DISTINCT r.airline
			FROM \`travel-sample\`.inventory.route r 
			WHERE r.sourceairport = ? OR r.destinationairport = ?
			ORDER BY r.airline
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
			return c.json(
				{ error: `Error executing airlines query: ${response.statusText}. Detail: ${errorBody}` },
				response.status as any
			);
		}
		
		const data = await response.json() as any;
		return c.json(data);
	} catch (error: any) {
		console.error("Error executing airlines query:", error);
		return c.json(
			{ error: error.message },
			500
		);
	}
}; 