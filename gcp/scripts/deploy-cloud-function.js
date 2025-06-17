import path from 'path';
import { fileURLToPath } from 'url';

import {
    PROJECT_ID,
    REGION,
    MEMORY,
    TIMEOUT,
    RUNTIME,
    FUNCTIONS,
    CLOUD_FUNCTION_ENV
} from '../utils/config.js';

import { executeCommand } from '../utils/helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createCloudFunction(functionName, handlerFile, environment) {
    try {
        const srcPath = path.join(__dirname, '..');
        
        const envVarsString = Object.entries(environment)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        const cmd = `gcloud functions deploy ${functionName} \
            --runtime ${RUNTIME} \
            --trigger-http \
            --entry-point ${functionName} \
            --source ${srcPath} \
            --memory ${MEMORY} \
            --timeout ${TIMEOUT} \
            --region ${REGION} \
            --project ${PROJECT_ID} \
            --set-env-vars "${envVarsString}"`;

        executeCommand(cmd);
        console.log(`Created Cloud Function ${functionName}`);
        
    } catch (error) {
        console.error(`Error creating Cloud Function ${functionName}:`, error);
        throw error;
    }
}

async function main() { 
    try {
        console.log('Starting Cloud Function deployment...');
        
        for (const func of FUNCTIONS) {
            const functionName = `${func.name}`;
            const handlerFile = `${func.name}.js`;
            
            console.log(`Deploying Cloud Function: ${functionName}`);

            createCloudFunction(functionName, handlerFile, CLOUD_FUNCTION_ENV);
            
            console.log(`Successfully deployed Cloud Function: ${functionName}`);
        }
        
        console.log('\nAll Cloud Functions deployed successfully!');
        
    } catch (error) {
        console.error('Error in main process while deploying cloud functions:', error);
        process.exit(1);
    }
}

main();