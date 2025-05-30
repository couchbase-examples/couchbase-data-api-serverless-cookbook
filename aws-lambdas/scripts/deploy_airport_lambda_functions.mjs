import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LAMBDA_ROLE = process.env.LAMBDA_ROLE;
const REGION = process.env.REGION;
const MEMORY_SIZE = process.env.MEMORY_SIZE || '128';
const TIMEOUT = process.env.TIMEOUT || '30';

// Lambda functions configuration
const FUNCTIONS = [
    { name: 'createAirport', method: 'POST', path: '/airports/{airportId}' },
    { name: 'getAirport', method: 'GET', path: '/airports/{airportId}' },
    { name: 'updateAirport', method: 'PUT', path: '/airports/{airportId}' },
    { name: 'deleteAirport', method: 'DELETE', path: '/airports/{airportId}' },
    { name: 'getAirportRoutes', method: 'POST', path: '/airports/routes' },
    { name: 'getAirportAirlines', method: 'POST', path: '/airports/airlines' }
];

function executeCommand(cmd) {
    try {
        const output = execSync(cmd, { encoding: 'utf-8' });
        return output.trim();
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

async function createZipFile(functionName, handlerFile) {
    const handlerPath = path.join(__dirname, '..', 'src', handlerFile);
    const zipDir = path.join(__dirname, '..', 'zips');
    
    // Create zips directory if it doesn't exist
    if (!fs.existsSync(zipDir)) {
        await fs.promises.mkdir(zipDir);
    }
    
    const zipPath = path.join(zipDir, `${functionName}.zip`);
    
    try {
        // Create zip file containing the handler file
        executeCommand(`zip -j ${zipPath} ${handlerPath}`);
        return zipPath;
    } catch (error) {
        console.error(`Error creating zip file for ${functionName}:`, error);
        throw error;
    }
}

function createLambdaFunction(functionName, zipPath, environment, handlerFile) {
    try {
        const envVarsString = Object.entries(environment)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        
        const cmd = `aws lambda create-function \
            --function-name ${functionName} \
            --runtime nodejs22.x \
            --handler ${path.basename(handlerFile, '.mjs')}.handler \
            --role ${LAMBDA_ROLE} \
            --zip-file fileb://${zipPath} \
            --memory-size ${MEMORY_SIZE} \
            --timeout ${TIMEOUT} \
            --environment "Variables={${envVarsString}}" \
            --region ${REGION}`;
        
        const output = executeCommand(cmd);
        console.log(`Created Lambda function ${functionName}:`, output);
        
        // Clean up zip file
        fs.unlinkSync(zipPath);
    } catch (error) {
        console.error(`Error creating Lambda function ${functionName}:`, error);
        // Clean up zip file even if there's an error
        try {
            fs.unlinkSync(zipPath);
        } catch (e) {
            // Ignore cleanup errors
        }
        throw error;
    }
}

async function main() {
    try {
        // Create Lambda functions for each handler
        for (const func of FUNCTIONS) {
            // Create function name in format: data-api-{function}
            const functionName = `data-api-${func.name}`;
            const handlerFile = `${func.name}.mjs`;
            
            // Create environment variables
            const environment = {
                BASE_URL: process.env.BASE_URL,
                CLUSTER_PASSWORD: process.env.CLUSTER_PASSWORD,
                USERNAME: process.env.USERNAME
            };
            
            console.log(`Creating Lambda function: ${functionName}`);
            
            // Create zip file
            const zipPath = await createZipFile(functionName, handlerFile);
            
            // Create Lambda function
            createLambdaFunction(functionName, zipPath, environment, handlerFile);
            
            console.log(`Successfully created Lambda function: ${functionName}`);
        }

        // Clean up zips directory
        const zipDir = path.join(__dirname, '..', 'zips');
        if (fs.existsSync(zipDir)) {
            await fs.promises.rm(zipDir, { recursive: true });
            console.log('Cleaned up zips directory');
        }
        
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Validate required environment variables
const requiredEnvVars = ['LAMBDA_ROLE', 'REGION', 'BASE_URL', 'CLUSTER_PASSWORD', 'USERNAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

main(); 