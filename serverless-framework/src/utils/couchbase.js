// Collection configuration
export const COLLECTION_CONFIG = {
    bucket: 'travel-sample',
    scope: 'inventory',
    collection: 'airport'
};

// FTS configuration
export const FTS_CONFIG = {
    indexName: 'hotel-geo-index'
};

// Error formatting function
export const formatError = (error) => {
    return {
        statusCode: error.statusCode || 500,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
            error: error.code || "InternalError",
            message: error.message || "An unexpected error occurred"
        })
    };
};

// Success response formatter
export const formatSuccess = (data, statusCode = 200, headers = {}) => {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            ...headers
        },
        body: typeof data === 'string' ? data : JSON.stringify(data)
    };
};

// Validate environment variables
export const validateEnvironment = () => {
    const required = ['DATA_API_ENDPOINT', 'DATA_API_USERNAME', 'DATA_API_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw {
            statusCode: 500,
            code: "ConfigurationError",
            message: `Missing required environment variables: ${missing.join(', ')}`
        };
    }
};

// Create Basic Auth header
export const createAuthHeader = () => {
    const username = process.env.DATA_API_USERNAME;
    const password = process.env.DATA_API_PASSWORD;
    return Buffer.from(`${username}:${password}`).toString('base64');
};

// Generic Couchbase Data API request function
export const makeCouchbaseRequest = async (endpoint, options = {}) => {
    validateEnvironment();
    
    const baseUrl = process.env.DATA_API_ENDPOINT;
    const auth = createAuthHeader();
    
    const requestOptions = {
        method: 'GET',
        ...options,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${auth}`,
            ...options.headers
        }
    };
    const url = `${baseUrl}${endpoint}`;
    
    try {
        const response = await fetch(url, requestOptions);
        const responseData = await response.text();
        
        if (response.ok) {
            return {
                success: true,
                data: responseData,
                status: response.status,
                headers: response.headers
            };
        } else {
            const errorCode = response.status === 404 ? 'DocumentNotFound' :
                            response.status === 403 ? 'InvalidAuth' :
                            response.status === 400 ? 'InvalidArgument' : 'InternalError';
            
            return {
                success: false,
                error: {
                    statusCode: response.status,
                    code: errorCode,
                    message: responseData || 'An error occurred processing the request'
                }
            };
        }
    } catch (error) {
        console.error('Couchbase API request error:', error);
        return {
            success: false,
            error: {
                statusCode: 500,
                code: "NetworkError",
                message: error.message || "Network error occurred"
            }
        };
    }
}; 