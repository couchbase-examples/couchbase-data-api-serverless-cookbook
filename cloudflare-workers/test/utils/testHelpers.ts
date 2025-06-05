import { vi, expect } from 'vitest';
import { Env } from '../../src/types/env';
import { AirportDocument } from '../../src/types/airport';

// Test environment
export const mockEnv: Env = {
	DATA_API_USERNAME: 'test_user',
	DATA_API_PASSWORD: 'test_password',
	DATA_API_ENDPOINT: 'test.endpoint.com',
};

// Sample test data
export const mockAirportData: AirportDocument = {
	airportname: 'Test Airport',
	city: 'Test City',
	country: 'Test Country',
	faa: 'TST',
	geo: {
		alt: 100,
		lat: 34.0522,
		lon: -118.2437,
	},
	icao: 'KTST',
	id: 9999,
	type: 'airport',
	tz: 'America/Los_Angeles',
};

// Mock fetch responses
export const createMockResponse = (
	data: any,
	status: number = 200,
	statusText: string = 'OK'
) => {
	return new Response(JSON.stringify(data), {
		status,
		statusText,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const createMockErrorResponse = (
	status: number,
	statusText: string,
	errorMessage?: string
) => {
	return new Response(errorMessage || statusText, {
		status,
		statusText,
	});
};

// Global fetch mock helper
export const mockFetch = (mockResponse: Response) => {
	globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);
	return globalThis.fetch as any;
};

// Mock Hono Context
export const createMockContext = (
	params: Record<string, string> = {},
	query: Record<string, string | undefined> = {},
	body?: any
) => {
	const mockRequest = {
		param: vi.fn((key: string) => params[key]),
		query: vi.fn((key: string) => query[key]),
		json: vi.fn().mockResolvedValue(body),
	};

	const mockJson = vi.fn((data: any, status?: number) => {
		return new Response(JSON.stringify(data), {
			status: status || 200,
			headers: { 'Content-Type': 'application/json' },
		});
	});

	return {
		req: mockRequest,
		env: mockEnv,
		json: mockJson,
	} as any;
};

// Helper to parse response
export const parseResponse = async (response: Response) => {
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

// Assertion helpers
export const expectSuccessResponse = (response: Response, expectedStatus: number = 200) => {
	expect(response.status).toBe(expectedStatus);
	expect(response.headers.get('Content-Type')).toBe('application/json');
};

export const expectErrorResponse = (response: Response, expectedStatus: number) => {
	expect(response.status).toBe(expectedStatus);
	expect(response.headers.get('Content-Type')).toBe('application/json');
}; 