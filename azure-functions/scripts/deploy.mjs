import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { StorageManagementClient } from '@azure/arm-storage';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Default configuration values - all hardcoded for simplicity
const CONFIG = {
  subscriptionId: 'cc949f34-d2d5-491a-ba99-bf35ffc109f6',
  resourceGroup: 'couchbase-functions-rg',
  location: 'East US',
  functionAppName: 'couchbase-functions-app',
  storageAccount: 'couchbasestorage',
  dataApiEndpoint: 'https://ey6xkcvjmzkr5-bk.data.sandbox.nonprod-project-avengers.com',
  dataApiUsername: 'test',
  dataApiPassword: 'Tester@123'
};

async function validateConfig() {
  console.log(chalk.green('✅ Using default configuration'));
  console.log(chalk.blue('📋 Deployment Configuration:'));
  console.log(chalk.gray(`  Resource Group: ${CONFIG.resourceGroup}`));
  console.log(chalk.gray(`  Location: ${CONFIG.location}`));
  console.log(chalk.gray(`  Function App: ${CONFIG.functionAppName}`));
  console.log(chalk.gray(`  Storage Account: ${CONFIG.storageAccount}`));
  console.log(chalk.gray(`  Data API Endpoint: ${CONFIG.dataApiEndpoint}`));
}

async function ensureResourceGroup(client) {
  console.log(chalk.blue('Ensuring resource group exists...'));
  await client.resourceGroups.createOrUpdate(CONFIG.resourceGroup, {
    location: CONFIG.location
  });
}

async function ensureStorageAccount(client) {
  console.log(chalk.blue('Ensuring storage account exists...'));
  await client.storageAccounts.beginCreateAndWait(
    CONFIG.resourceGroup,
    CONFIG.storageAccount,
    {
      sku: { name: 'Standard_LRS' },
      kind: 'StorageV2',
      location: CONFIG.location
    }
  );
  
  const keys = await client.storageAccounts.listKeys(
    CONFIG.resourceGroup,
    CONFIG.storageAccount
  );
  return `DefaultEndpointsProtocol=https;AccountName=${CONFIG.storageAccount};AccountKey=${keys.keys[0].value};EndpointSuffix=core.windows.net`;
}

async function createFunctionApp(client, storageConnectionString) {
  console.log(chalk.blue('Creating/updating function app...'));
  await client.webApps.beginCreateOrUpdateAndWait(
    CONFIG.resourceGroup,
    CONFIG.functionAppName,
    {
      location: CONFIG.location,
      kind: 'functionapp',
      siteConfig: {
        appSettings: [
          { name: 'AzureWebJobsStorage', value: storageConnectionString },
          { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' },
          { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~22' },
          // Couchbase Data API settings
          { name: 'DATA_API_ENDPOINT', value: CONFIG.dataApiEndpoint },
          { name: 'DATA_API_USERNAME', value: CONFIG.dataApiUsername },
          { name: 'DATA_API_PASSWORD', value: CONFIG.dataApiPassword }
        ],
        nodeVersion: '~18'
      }
    }
  );
}

async function deployFunction() {
  try {
    console.log(chalk.blue('🚀 Starting Azure Functions deployment...'));
    
    // Validate configuration
    await validateConfig();
    
    // Build the project
    console.log(chalk.blue('📦 Building project...'));
    await execAsync('npm run build');
    console.log(chalk.green('✅ Build completed'));
    
    // Initialize Azure clients
    console.log(chalk.blue('🔐 Authenticating with Azure...'));
    const credential = new DefaultAzureCredential();
    const resourceClient = new ResourceManagementClient(credential, CONFIG.subscriptionId);
    const webClient = new WebSiteManagementClient(credential, CONFIG.subscriptionId);
    const storageClient = new StorageManagementClient(credential, CONFIG.subscriptionId);

    // Ensure infrastructure exists
    await ensureResourceGroup(resourceClient);
    const storageConnectionString = await ensureStorageAccount(storageClient);
    await createFunctionApp(webClient, storageConnectionString);

    // Deploy the function using Azure Functions Core Tools
    console.log(chalk.blue('🚀 Deploying functions...'));
    await execAsync('func azure functionapp publish ' + CONFIG.functionAppName + ' --typescript');

    console.log(chalk.green('🎉 Deployment completed successfully!'));
    console.log(chalk.blue(`📱 Your function app is available at: https://${CONFIG.functionAppName}.azurewebsites.net`));
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:'), error);
    process.exit(1);
  }
}

deployFunction(); 