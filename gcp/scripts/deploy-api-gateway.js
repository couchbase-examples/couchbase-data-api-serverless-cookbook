import {
    enableRequiredServices,
    createApi,
    createApiConfig,
    createGateway,
    getGatewayUrl,
    checkApiExists,
    checkGatewayExists,
    updateGateway,
    getFunctionUrl
} from '../utils/gcloud-commands.js';

import fs from 'fs';
import path from 'path';
import { 
    API_NAME, 
    API_CONFIG_NAME, 
    GATEWAY_NAME,
    FUNCTIONS
} from '../utils/config.js';

function createApiSpecWithInjectedUrls() {
    const templatePath = path.join(process.cwd(), 'api-spec.yaml');
    const outputPath = path.join(process.cwd(), 'api-spec-generated.yaml');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
        throw new Error(`API spec template not found: ${templatePath}`);
    }
    
    console.log('Reading API spec template...');
    let apiSpecContent = fs.readFileSync(templatePath, 'utf8');
    
    console.log('Getting function URLs and injecting into template...');
    
    // Get URLs for each function and inject them
    FUNCTIONS.forEach(func => {
        try {
            const url = getFunctionUrl(func.name);
            console.log(`${func.name}: ${url}`);
            
            // Replace placeholders based on function name
            const placeholder = getFunctionPlaceholder(func.name);
            if (placeholder) {
                apiSpecContent = apiSpecContent.replace(new RegExp(placeholder, 'g'), url);
                console.log(`Injected ${placeholder}`);
            }
        } catch (error) {
            console.log(`${func.name}: ${error.message}`);
        }
    });
    
    // Write the generated spec
    fs.writeFileSync(outputPath, apiSpecContent);
    console.log(`Generated API spec: ${outputPath}`);
    
    return outputPath;
}

function getFunctionPlaceholder(functionName) {
    const placeholderMap = {
        'data-api-getairport': '{{GET_AIRPORT_FUNCTION_URL}}',
        'data-api-createairport': '{{CREATE_AIRPORT_FUNCTION_URL}}',
        'data-api-updateairport': '{{UPDATE_AIRPORT_FUNCTION_URL}}', 
        'data-api-deleteairport': '{{DELETE_AIRPORT_FUNCTION_URL}}',
        'data-api-getairportroutes': '{{GET_AIRPORT_ROUTES_FUNCTION_URL}}',
        'data-api-getairportairlines': '{{GET_AIRPORT_AIRLINES_FUNCTION_URL}}',
        'data-api-gethotelsnearairport': '{{GET_HOTELS_NEAR_AIRPORT_FUNCTION_URL}}'
    };
    
    return placeholderMap[functionName.toLowerCase()];
}

function main() {
    try {
        console.log('Starting API Gateway deployment...');
        
        // Enable required services
        enableRequiredServices();
        
        // Create OpenAPI specification by injecting function URLs
        const specPath = createApiSpecWithInjectedUrls();
        
        // Create API if it doesn't exist
        if (!checkApiExists(API_NAME)) {
            createApi(API_NAME);
            console.log('API created:', API_NAME);
        } else {
            console.log('API already exists:', API_NAME);
        }
        
        // Create API config
        const configName = createApiConfig(API_NAME, API_CONFIG_NAME, specPath);
        console.log('API config created:', configName);
        
        // Create gateway if it doesn't exist
        if (!checkGatewayExists(GATEWAY_NAME)) {
            createGateway(GATEWAY_NAME, API_NAME, configName);
            console.log('Gateway created:', GATEWAY_NAME);
        } else {
            updateGateway(GATEWAY_NAME, configName);
            console.log('Gateway updated:', GATEWAY_NAME);
        }
        
        // Get gateway URL
        const gatewayUrl = getGatewayUrl(GATEWAY_NAME);
        
        console.log('API Gateway setup complete!');
        console.log(`Gateway URL: https://${gatewayUrl}`);
        console.log('Test your API:');
        
    } catch (error) {
        console.error('Error while deploying API Gateway:', error);
        process.exit(1);
    }
}

main(); 