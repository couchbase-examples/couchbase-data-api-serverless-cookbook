import { PROJECT_ID, REGION } from './config.js';
import { executeCommand } from './helper.js';

export function getFunctionUrl(functionName) {
    console.log(`Getting URL for Cloud Function: ${functionName}`);
    
    const cmd = `gcloud functions describe ${functionName} --region=${REGION} --project=${PROJECT_ID} --gen2 --format="value(serviceConfig.uri)"`;
    const url = executeCommand(cmd);
    if (!url || url.trim() === '') {
        throw new Error(`No URL found for function ${functionName}`);
    }
    return url;
}

export function createApi(apiName) {
    console.log(`Creating API: ${apiName}`);
    
    const cmd = `gcloud api-gateway apis create ${apiName} \
        --project=${PROJECT_ID}`;
    
    executeCommand(cmd);
    return apiName;
}

export function createApiConfig(apiName, apiConfigName, specPath) {
    console.log(`Creating API config: ${apiConfigName}`);
    const timestamp = Date.now();
    const configName = `${apiConfigName}-${timestamp}`;
    
    const cmd = `gcloud api-gateway api-configs create ${configName} \
        --api=${apiName} \
        --openapi-spec=${specPath} \
        --project=${PROJECT_ID}`;
    
    executeCommand(cmd);
    return configName;
}

export function createGateway(gatewayName, apiName, configName) {
    console.log(`Creating gateway: ${gatewayName}, Might take a few minutes...`);
    
    const cmd = `gcloud api-gateway gateways create ${gatewayName} \
        --api=${apiName} \
        --api-config=${configName} \
        --location=${REGION} \
        --project=${PROJECT_ID}`;
    
    executeCommand(cmd);
    return gatewayName;
}

export function getGatewayUrl(gatewayName) {
    console.log('Getting gateway URL...');
    
    const cmd = `gcloud api-gateway gateways describe ${gatewayName} \
        --location=${REGION} \
        --project=${PROJECT_ID} \
        --format="value(defaultHostname)"`;
    
    return executeCommand(cmd);
}

export function enableRequiredServices() {
    console.log('Enabling required services...');
    const services = [
        'apigateway.googleapis.com',
        'servicemanagement.googleapis.com',
        'servicecontrol.googleapis.com'
    ];
    
    for (const service of services) {
        const cmd = `gcloud services enable ${service} --project=${PROJECT_ID}`;
        executeCommand(cmd);
    }
}

export function checkApiExists(apiName) {
    try {
        const cmd = `gcloud api-gateway apis describe ${apiName} --project=${PROJECT_ID}`;
        executeCommand(cmd);
        return true;
    } catch (error) {
        console.log("Api: ", apiName, " does not exist");
        return false;
    }
}

export function checkGatewayExists(gatewayName) {
    try {
        const cmd = `gcloud api-gateway gateways describe ${gatewayName} \
            --location=${REGION} \
            --project=${PROJECT_ID}`;
        executeCommand(cmd);
        return true;
		} catch (error) {
			console.log("Api gateway: ", gatewayName, " does not exist");
			return false;
		}
	}

export function updateGateway(gatewayName, configName, apiId) {
    console.log('Updating existing gateway... Might take a few minutes...');
    
    const cmd = `gcloud api-gateway gateways update ${gatewayName} \
        --api=${apiId} \
        --api-config=${configName} \
        --location=${REGION} \
        --project=${PROJECT_ID}`;
    executeCommand(cmd);
    console.log('Gateway updated');
}

export { executeCommand }; 