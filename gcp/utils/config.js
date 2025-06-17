function validateEnvironment() {
    const requiredEnvVars = [
        'PROJECT_ID',
        'DATA_API_ENDPOINT', 
        'DB_PASSWORD', 
        'DB_USERNAME', 
        'DB_BUCKET_NAME'
    ];
    
    const optionalEnvVars = [
        'REGION',
        'MEMORY',
        'TIMEOUT', 
        'RUNTIME',
        'DB_SCOPE',
        'DB_COLLECTION'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
}

validateEnvironment();

// Google Cloud Configuration
export const PROJECT_ID = process.env.PROJECT_ID;
export const REGION = process.env.REGION || 'us-central1';

// API Gateway Configuration
export const API_NAME = 'couchbase-data-api';
export const API_CONFIG_NAME = `${API_NAME}-config`;
export const GATEWAY_NAME = `${API_NAME}-gateway`;

// Cloud Function Configuration
export const MEMORY = process.env.MEMORY || '128Mi';
export const TIMEOUT = process.env.TIMEOUT || '60s';
export const RUNTIME = process.env.RUNTIME || 'nodejs22';

// Database Configuration
export const DATA_API_ENDPOINT = process.env.DATA_API_ENDPOINT;
export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_BUCKET_NAME = process.env.DB_BUCKET_NAME;
export const DB_SCOPE = process.env.DB_SCOPE || 'inventory';
export const DB_COLLECTION = process.env.DB_COLLECTION || 'airport';

// Routes Configuration
export const ROUTES = [
    { path: '/airports/{airportId}', method: 'GET', function: 'getAirport' },
    { path: '/airports/{airportId}', method: 'POST', function: 'createAirport' },
    { path: '/airports/{airportId}', method: 'PUT', function: 'updateAirport' },
    { path: '/airports/{airportId}', method: 'DELETE', function: 'deleteAirport' },
    { path: '/airports/{airportId}/routes', method: 'GET', function: 'getAirportRoutes' },
    { path: '/airports/{airportId}/airlines', method: 'GET', function: 'getAirportAirlines' },
    { path: '/airports/{airportId}/hotels/nearby', method: 'GET', function: 'getHotelsNearAirport' }
];

// Function Definitions
export const FUNCTIONS = [
    { name: 'getAirport' },
    { name: 'createAirport' },
    { name: 'updateAirport' },
    { name: 'deleteAirport' },
    { name: 'getAirportRoutes' },
    { name: 'getAirportAirlines' },
    { name: 'getHotelsNearAirport' }
];

export const CLOUD_FUNCTION_ENV = {
    DATA_API_ENDPOINT,
    DB_PASSWORD,
    DB_USERNAME,
    DB_BUCKET_NAME,
    DB_SCOPE,
    DB_COLLECTION
};

export { validateEnvironment };