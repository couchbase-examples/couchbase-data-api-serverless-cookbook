import { HttpResponseInit } from '@azure/functions';

export interface ApiError {
    statusCode: number;
    code: string;
    message: string;
}

export const createErrorResponse = (error: ApiError): HttpResponseInit => {
    return {
        status: error.statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            error: error.code,
            message: error.message
        })
    };
};

export const handleCouchbaseError = (status: number, message: string): ApiError => {
    const errorCode = status === 404 ? 'DocumentNotFound' :
                     status === 403 ? 'InvalidAuth' :
                     status === 400 ? 'InvalidArgument' : 'InternalError';
    
    return {
        statusCode: status,
        code: errorCode,
        message: message || 'An error occurred processing the request'
    };
};

export const createValidationError = (message: string): ApiError => {
    return {
        statusCode: 400,
        code: 'ValidationError',
        message
    };
};

export const createConfigurationError = (message: string): ApiError => {
    return {
        statusCode: 500,
        code: 'ConfigurationError',
        message
    };
}; 