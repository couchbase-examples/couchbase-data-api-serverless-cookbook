// This file is required by package.json main field
// It imports all handler functions so they get registered with the Functions Framework

import './src/getAirport.js';
import './src/createAirport.js';
import './src/updateAirport.js';
import './src/deleteAirport.js';
import './src/getAirportRoutes.js';
import './src/getAirportAirlines.js';
import './src/getHotelsNearAirport.js';

export const handler = (req, res) => {
    res.status(404).send('Function not found');
}; 