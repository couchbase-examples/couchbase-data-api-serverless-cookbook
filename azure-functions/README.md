# Azure Functions Couchbase API

This project contains a set of Azure Functions for interacting with a Couchbase database.

## Prerequisites

- Node.js
- Azure Functions Core Tools
- An Azure subscription

## Setup

1.  Navigate to the `azure-functions` directory.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Log in to your Azure account:
    ```bash
    az login
    ```
4.  Run the setup script to configure your `local.settings.json` file. This will prompt you for your Azure subscription ID, a resource group name, a location, a function app name, and a storage account name.
    ```bash
    npm run setup
    ```

## Deployment

To deploy the functions to Azure, run the following command:

```bash
npm run deploy
```

This will:

1.  Create a resource group if it doesn't exist.
2.  Create a storage account if it doesn't exist.
3.  Create a function app if it doesn't exist.
4.  Deploy the functions.

## Local Development

To run the functions locally, use the following command:

```bash
npm start
```
