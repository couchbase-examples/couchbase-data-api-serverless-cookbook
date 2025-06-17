// This file is required by package.json main field
// It imports all handler functions so they get registered with the Functions Framework

import './src/handler/getAirport.js';
import './src/handler/createAirport.js';
import './src/handler/updateAirport.js';
import './src/handler/deleteAirport.js';
import './src/handler/getAirportRoutes.js';
import './src/handler/getAirportAirlines.js';
import './src/handler/getHotelsNearAirport.js';

export const handler = (req, res) => {
    res.status(404).send('Function not found');
}; 