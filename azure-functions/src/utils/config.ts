// Collection configuration
export const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
};

// Environment configuration
export const getConfig = () => {
    const config = {
        dataApiEndpoint: process.env.DATA_API_ENDPOINT,
        username: process.env.DATA_API_USERNAME,
        password: process.env.DATA_API_PASSWORD
    };

    // Validate required environment variables
    if (!config.dataApiEndpoint || !config.username || !config.password) {
        throw new Error('Missing required environment variables: DATA_API_ENDPOINT, DATA_API_USERNAME, DATA_API_PASSWORD');
    }

    return config;
};

// Helper function to create Basic Auth header
export const createAuthHeader = (username: string, password: string): string => {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}; 