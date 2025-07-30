#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Load optional overrides from local.settings.json
let localConfig = {};
try {
    const cfgPath = path.resolve(process.cwd(), 'local.settings.json');
    if (fs.existsSync(cfgPath)) {
        const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        localConfig = raw.Values || {};
    }
} catch (e) {
    console.warn('Could not read local.settings.json – using defaults');
}

const requiredKeys = [
    'RESOURCE_GROUP',
    'STORAGE_ACCOUNT',
    'FUNCTION_APP',
    'AZURE_LOCATION'
];
requiredKeys.forEach(k => {
    if (!localConfig[k]) {
        console.error(`Missing required setting "${k}" in local.settings.json → Values section.`);
        process.exit(1);
    }
});

const { RESOURCE_GROUP, STORAGE_ACCOUNT, FUNCTION_APP, AZURE_LOCATION: LOCATION } = localConfig;

function runCommand(command, description) {
    console.log(chalk.blue(`\n${description}...`));
    try {
        const output = execSync(command, { encoding: 'utf8' });
        console.log(chalk.green('Success'));
        return output;
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

function checkPrerequisites() {
    console.log(chalk.yellow('Checking prerequisites...'));
    
    try {
        execSync('az --version', { stdio: 'ignore' });
        console.log(chalk.green(' Azure CLI is installed'));
    } catch (error) {
        console.error(chalk.red(' Azure CLI is not installed. Please install it first.'));
        process.exit(1);
    }
    
    try {
        execSync('func --version', { stdio: 'ignore' });
        console.log(chalk.green('Azure Functions Core Tools is installed'));
    } catch (error) {
        console.error(chalk.red('Azure Functions Core Tools is not installed. Please install it first.'));
        process.exit(1);
    }
}

function createAzureResources() {
    console.log(chalk.yellow('\nCreating Azure resources...'));
    
    // Check if user is logged in
    try {
        execSync('az account show', { stdio: 'ignore' });
    } catch (error) {
        console.error(chalk.red('✗ You are not logged in to Azure. Please run "az login" first.'));
        process.exit(1);
    }
    
    // Create Resource Group
    runCommand(
        `az group create -g ${RESOURCE_GROUP} -l ${LOCATION}`,
        'Creating Resource Group'
    );
    
    // Create Storage Account
    runCommand(
        `az storage account create -n ${STORAGE_ACCOUNT} -g ${RESOURCE_GROUP} -l ${LOCATION} --sku Standard_LRS`,
        'Creating Storage Account'
    );
    
    // Create Function App
    runCommand(
        `az functionapp create -g ${RESOURCE_GROUP} --consumption-plan-location ${LOCATION} -n ${FUNCTION_APP} -s ${STORAGE_ACCOUNT} --runtime node --os-type Linux --functions-version 4`,
        'Creating Function App'
    );
}

function deployFunction() {
    console.log(chalk.yellow('\nDeploying function to Azure...'));
    
    // Build the project
    runCommand('npm run build', 'Building TypeScript project');
    
    // Deploy to Azure
    runCommand(
        `func azure functionapp publish ${FUNCTION_APP}`,
        'Deploying to Azure Function App'
    );
}

function configureCouchbaseCredentials() {
    console.log(chalk.yellow('\nConfiguring Couchbase credentials...'));
    
    // Get Couchbase credentials from local.settings.json
    const couchbaseConfig = {
        DATA_API_ENDPOINT: localConfig.DATA_API_ENDPOINT,
        DATA_API_USERNAME: localConfig.DATA_API_USERNAME,
        DATA_API_PASSWORD: localConfig.DATA_API_PASSWORD
    };
    
    // Check if Couchbase credentials are available
    if (!couchbaseConfig.DATA_API_ENDPOINT || !couchbaseConfig.DATA_API_USERNAME || !couchbaseConfig.DATA_API_PASSWORD) {
        console.log(chalk.yellow('Couchbase credentials not found in local.settings.json'));
        console.log(chalk.cyan('Please configure them manually using:'));
        console.log(chalk.cyan(`az functionapp config appsettings set --name ${FUNCTION_APP} --resource-group ${RESOURCE_GROUP} --settings DATA_API_ENDPOINT="your-endpoint" DATA_API_USERNAME="your-username" DATA_API_PASSWORD="your-password"`));
        return;
    }
    
    // Configure Couchbase credentials in Function App
    runCommand(
        `az functionapp config appsettings set --name ${FUNCTION_APP} --resource-group ${RESOURCE_GROUP} --settings DATA_API_ENDPOINT="${couchbaseConfig.DATA_API_ENDPOINT}" DATA_API_USERNAME="${couchbaseConfig.DATA_API_USERNAME}" DATA_API_PASSWORD="${couchbaseConfig.DATA_API_PASSWORD}"`,
        'Setting Couchbase credentials in Function App'
    );
    
    console.log(chalk.green(' Couchbase credentials configured successfully'));
}

function getFunctionUrls() {
    console.log(chalk.yellow('\nGetting function URLs...'));
    
    const output = runCommand(
        `az functionapp function list -g ${RESOURCE_GROUP} -n ${FUNCTION_APP} --query "[].{name: name, url: invokeUrlTemplate}"`,
        'Retrieving function URLs'
    );
    
    console.log(chalk.green('\nFunction URLs:'));
    console.log(output);
}

function cleanup() {
    console.log(chalk.yellow('\nTo clean up Azure resources, run:'));
    console.log(chalk.cyan(`az group delete --name ${RESOURCE_GROUP}`));
    console.log(chalk.yellow('Note: Also delete the Application Insights Resource Group (DefaultResourceGroup-*)'));
}

async function main() {
    console.log(chalk.blue('🚀 Azure Functions Deployment Script'));
    console.log(chalk.gray('Following the tutorial from Cloud Engineer Skills\n'));
    
    checkPrerequisites();
    createAzureResources();
    deployFunction();
    configureCouchbaseCredentials();
    getFunctionUrls();
    cleanup();
    
    console.log(chalk.green('\nDeployment completed successfully!'));
    console.log(chalk.blue('\nYou can now test your function using the URLs provided above.'));
}

main().catch(console.error); 