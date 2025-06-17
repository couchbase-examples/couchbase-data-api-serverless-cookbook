import { getGatewayUrl } from '../utils/gcloud-commands.js';
import { GATEWAY_NAME } from '../utils/config.js';

let gatewayUrl;

beforeAll(async () => {
    console.log('Setting up integration tests...');
    try {
        gatewayUrl = await getGatewayUrl(GATEWAY_NAME);
        if (!gatewayUrl) {
            throw new Error('Failed to get gateway URL');
        }
        // Make the URL available globally for all tests
        global.API_BASE_URL = `https://${gatewayUrl}`;
        console.log(`API Gateway URL: ${global.API_BASE_URL}`);
    } catch (error) {
        console.error('Failed to setup tests:', error);
        throw error;
    }
});

afterAll(async () => {
    console.log('Cleaning up integration tests...');
}); 