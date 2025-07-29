// Main entry point for Azure Functions
// This file imports all functions to register them with the Azure Functions runtime

import './functions/test/index';
import './functions/createAirport';
import './functions/deleteAirport';
import './functions/getAirport';
import './functions/getAirportAirlines';
import './functions/getAirportRoutes';
import './functions/getHotelsNearAirport';
import './functions/updateAirport';