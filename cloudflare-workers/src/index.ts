import { Hono } from 'hono';
import { Env } from './types/env';
import { createAirport } from './handlers/createAirport';
import { getAirport } from './handlers/getAirport';
import { updateAirport } from './handlers/updateAirport';
import { deleteAirport } from './handlers/deleteAirport';
import { getAirportRoutes } from './handlers/getAirportRoutes';
import { getAirportAirlines } from './handlers/getAirportAirlines';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Root route
app.get('/', (c) => {
	return c.json({
		message: "Welcome to the Airport Information System API"
	}, 200);
});

// Find routes for a specific airport
app.post('/airports/routes', getAirportRoutes);

// Find airlines that service a specific airport
app.post('/airports/airlines', getAirportAirlines);

// Get airport
app.get('/airports/:documentKey', getAirport);

// Create airport
app.post('/airports/:documentKey', createAirport);

// Update airport
app.put('/airports/:documentKey', updateAirport);

// Delete airport
app.delete('/airports/:documentKey', deleteAirport);

// Error handling
app.onError((err, c) => {
	console.error(`App error: ${err}`);
	return c.json({
		error: err.message || 'Internal Server Error'
	}, 500);
});

// Not found handling
app.notFound((c) => {
	return c.json({
		error: `Invalid path. Path received: ${c.req.path}`
	}, 404);
});

export default app;
