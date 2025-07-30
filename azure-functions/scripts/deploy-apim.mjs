#!/usr/bin/env node

import { DefaultAzureCredential } from '@azure/identity';
import { ApiManagementClient } from '@azure/arm-apimanagement';
import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Load overrides from local.settings.json if present
let localCfg = {};
try {
    const cfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'local.settings.json'), 'utf8'));
    localCfg = cfg.Values || {};
} catch {
    console.error('local.settings.json not found.');
    process.exit(1);
}

const req = ['SUBSCRIPTION_ID','RESOURCE_GROUP','AZURE_LOCATION','APIM_NAME','FUNCTION_APP'];
req.forEach(k=>{if(!localCfg[k]){console.error(`Missing ${k} in local.settings.json`);process.exit(1);}});

// Configuration
const CONFIG = {
    subscriptionId: localCfg.SUBSCRIPTION_ID,
    resourceGroup: localCfg.RESOURCE_GROUP,
    location:      localCfg.AZURE_LOCATION,
    apimName:      localCfg.APIM_NAME,
    functionAppName: localCfg.FUNCTION_APP,
    apiName: 'airport-api',
    apiVersion: 'v1',
    productName: 'airport-product',
    apiDescription: 'Airport Management API',
    apiPath: 'airports'
};

async function createAPIM(apimClient) {
    console.log(chalk.blue('\nCreating API Management instance...'));
    
    try {
        const apim = await apimClient.apiManagementService.beginCreateOrUpdateAndWait(
            CONFIG.resourceGroup,
            CONFIG.apimName,
            {
                location: CONFIG.location,
                sku: {
                    name: 'Consumption',
                    capacity: 0
                },
                publisherName: 'Couchbase',
                publisherEmail: 'admin@couchbase.com',
                virtualNetworkType: 'None',
                enableClientCertificate: false
            }
        );
        
        console.log(chalk.green('✓ APIM instance created successfully'));
        return apim;
    } catch (error) {
        console.error(chalk.red('✗ Error creating APIM:'), error.message);
        throw error;
    }
}

async function createAPI(apimClient) {
    console.log(chalk.blue('\nCreating API...'));
    
    try {
        const api = await apimClient.api.beginCreateOrUpdateAndWait(
            CONFIG.resourceGroup,
            CONFIG.apimName,
            CONFIG.apiName,
            {
                displayName: 'Airport API',
                description: CONFIG.apiDescription,
                path: CONFIG.apiPath,
                protocols: ['https'],
                serviceUrl: `https://${CONFIG.functionAppName}.azurewebsites.net/api/airports`
            }
        );
        
        console.log(chalk.green('✓ API created successfully'));
        return api;
    } catch (error) {
        console.error(chalk.red('✗ Error creating API:'), error.message);
        throw error;
    }
}

async function createProduct(apimClient) {
    console.log(chalk.blue('\nCreating Product...'));
    
    try {
        const product = await apimClient.product.createOrUpdate(
            CONFIG.resourceGroup,
            CONFIG.apimName,
            CONFIG.productName,
            {
                displayName: 'Airport Product',
                description: 'Product for Airport API - Consumption Plan',
                state: 'published',
                subscriptionRequired: false
            }
        );
        
        console.log(chalk.green('✓ Product created successfully'));
        return product;
    } catch (error) {
        console.error(chalk.red('✗ Error creating Product:'), error.message);
        throw error;
    }
}

async function addAPItoProduct(apimClient) {
    console.log(chalk.blue('\nAdding API to Product...'));
    
    try {
        await apimClient.productApi.createOrUpdate(
            CONFIG.resourceGroup,
            CONFIG.apimName,
            CONFIG.productName,
            CONFIG.apiName
        );
        
        console.log(chalk.green('✓ API added to product successfully'));
    } catch (error) {
        console.error(chalk.red('✗ Error adding API to product:'), error.message);
        throw error;
    }
}

async function createOperations(apimClient) {
    console.log(chalk.blue('\nCreating API Operations...'));
    
    const operations = [
        {
            name: 'getAirport',
            displayName: 'Get Airport',
            method: 'GET',
            urlTemplate: '{airportId}',
            description: 'Get airport details by ID',
            templateParameters: [
                { name: 'airportId', type: 'string', required: true, description: 'Airport ID' }
            ]
        },
        {
            name: 'createAirport',
            displayName: 'Create Airport',
            method: 'POST',
            urlTemplate: '',
            description: 'Create a new airport'
        },
        {
            name: 'updateAirport',
            displayName: 'Update Airport',
            method: 'PUT',
            urlTemplate: '{airportId}',
            description: 'Update airport details',
            templateParameters: [
                { name: 'airportId', type: 'string', required: true, description: 'Airport ID' }
            ]
        },
        {
            name: 'deleteAirport',
            displayName: 'Delete Airport',
            method: 'DELETE',
            urlTemplate: '{airportId}',
            description: 'Delete an airport',
            templateParameters: [
                { name: 'airportId', type: 'string', required: true, description: 'Airport ID' }
            ]
        },
        {
            name: 'getAirportAirlines',
            displayName: 'Get Airport Airlines',
            method: 'GET',
            urlTemplate: '{airportCode}/airlines',
            description: 'Get airlines for an airport',
            templateParameters: [
                { name: 'airportCode', type: 'string', required: true, description: 'Airport Code' }
            ]
        },
        {
            name: 'getAirportRoutes',
            displayName: 'Get Airport Routes',
            method: 'GET',
            urlTemplate: '{airportCode}/routes',
            description: 'Get routes for an airport',
            templateParameters: [
                { name: 'airportCode', type: 'string', required: true, description: 'Airport Code' }
            ]
        },
        {
            name: 'getHotelsNearAirport',
            displayName: 'Get Hotels Near Airport',
            method: 'GET',
            urlTemplate: '{airportId}/hotels/nearby/{distance}',
            description: 'Get hotels near an airport',
            templateParameters: [
                { name: 'airportId', type: 'string', required: true, description: 'Airport ID' },
                { name: 'distance', type: 'string', required: true, description: 'Distance in miles/km' }
            ]
        }
    ];
    
    for (const operation of operations) {
        try {
            await apimClient.apiOperation.createOrUpdate(
                CONFIG.resourceGroup,
                CONFIG.apimName,
                CONFIG.apiName,
                operation.name,
                {
                    displayName: operation.displayName,
                    method: operation.method,
                    urlTemplate: operation.urlTemplate,
                    description: operation.description,
                    templateParameters: operation.templateParameters || [],
                    request: {
                        queryParameters: [],
                        headers: []
                    },
                    responses: [
                        {
                            statusCode: 200,
                            description: 'Success',
                            representations: [
                                {
                                    contentType: 'application/json'
                                }
                            ]
                        },
                        {
                            statusCode: 400,
                            description: 'Bad Request',
                            representations: [
                                {
                                    contentType: 'application/json'
                                }
                            ]
                        },
                        {
                            statusCode: 404,
                            description: 'Not Found',
                            representations: [
                                {
                                    contentType: 'application/json'
                                }
                            ]
                        }
                    ]
                }
            );
            console.log(chalk.green(`Operation ${operation.name} created`));
        } catch (error) {
            console.error(chalk.red(`Error creating operation ${operation.name}:`), error.message || error);
            if (error?.details) {
                console.error(chalk.yellow(JSON.stringify(error.details, null, 2)));
            }
        }
    }
}

async function getAPIMGatewayUrl(apimClient) {
    console.log(chalk.blue('\nGetting APIM Gateway URL...'));
    
    try {
        const apim = await apimClient.apiManagementService.get(
            CONFIG.resourceGroup,
            CONFIG.apimName
        );
        
        const gatewayUrl = `https://${CONFIG.apimName}.azure-api.net`;
        console.log(chalk.green('APIM Gateway URL:'), gatewayUrl);
        return gatewayUrl;
    } catch (error) {
        console.error(chalk.red('Error getting APIM Gateway URL:'), error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log(chalk.blue('Fully Automated Azure API Management Deployment'));
        console.log(chalk.gray('Setting up complete APIM with API Gateway for Azure Functions\n'));
        
        // Initialize Azure clients
        console.log(chalk.blue('Authenticating with Azure...'));
        const credential = new DefaultAzureCredential();
        const apimClient = new ApiManagementClient(credential, CONFIG.subscriptionId);
        
        console.log(chalk.green('Authentication successful'));
        
        // Create APIM instance
        await createAPIM(apimClient);
        
        // Create API
        await createAPI(apimClient);
        
        // Create Product
        await createProduct(apimClient);
        
        // Add API to Product
        await addAPItoProduct(apimClient);
        
        // Create Operations
        await createOperations(apimClient);
        
        // Get Gateway URL
        const gatewayUrl = await getAPIMGatewayUrl(apimClient);
                
        console.log(chalk.green('\n Fully Automated APIM Deployment completed successfully!'));
        console.log(chalk.blue('\n Deployment Summary:'));
        console.log(chalk.gray(`  APIM Name: ${CONFIG.apimName}`));
        console.log(chalk.gray(`  API Name: ${CONFIG.apiName}`));
        console.log(chalk.gray(`  Product Name: ${CONFIG.productName}`));
        console.log(chalk.gray(`  Gateway URL: ${gatewayUrl}`));
             
    } catch (error) {
        console.error(chalk.red('\n APIM Deployment failed:'), error);
        process.exit(1);
    }
}

main(); 