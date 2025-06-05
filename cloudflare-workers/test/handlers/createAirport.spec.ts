import { describe, it, expect, vi } from 'vitest';
import { createAirport } from '../../src/handlers/createAirport';
import {
	mockFetch,
	createMockContext,
	createMockResponse,
	createMockErrorResponse,
	parseResponse,
	expectSuccessResponse,
	expectErrorResponse,
	mockAirportData,
} from '../utils/testHelpers';

describe('createAirport handler', () => {
	it('should parse request body and make correct API call', async () => {
		// Arrange
		const documentKey = 'airport_new';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockResponse({}, 201, 'Created');
		mockFetch(mockResponse);

		// Act
		const response = await createAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Authorization': expect.stringContaining('Basic'),
					'Content-Type': 'application/json',
				}),
				body: JSON.stringify(mockAirportData),
			})
		);
		expectSuccessResponse(response, 201);
	});

	it('should handle custom airport data in request body', async () => {
		// Arrange
		const documentKey = 'custom_airport';
		const customAirportData = {
			...mockAirportData,
			airportname: 'Custom Airport',
			faa: 'CUS',
			id: 7777,
		};
		const context = createMockContext({ documentKey }, {}, customAirportData);
		const mockResponse = createMockResponse(customAirportData, 201);
		mockFetch(mockResponse);

		// Act
		await createAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				body: JSON.stringify(customAirportData),
			})
		);
	});

	it('should return 400 when request body has invalid JSON', async () => {
		// Arrange
		const documentKey = 'airport_new';
		const context = createMockContext({ documentKey });
		context.req.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

		// Act
		const response = await createAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toBe('Invalid JSON in request body for new airport');
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should return 400 when request body has malformed JSON syntax', async () => {
		// Arrange
		const documentKey = 'airport_new';
		const context = createMockContext({ documentKey });
		context.req.json = vi.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

		// Act
		const response = await createAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toBe('Invalid JSON in request body for new airport');
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should forward API response status and error message', async () => {
		// Arrange
		const documentKey = 'test_airport';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockErrorResponse(409, 'Conflict', 'Document already exists');
		mockFetch(mockResponse);

		// Act
		const response = await createAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 409);
		expect(responseData.error).toContain('Error creating airport document');
		expect(responseData.error).toContain('Conflict');
		expect(responseData.error).toContain('Document already exists');
	});

	it('should handle API response without JSON body', async () => {
		// Arrange
		const documentKey = 'airport_new';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = new Response('', {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
		mockFetch(mockResponse);

		// Act
		const response = await createAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectSuccessResponse(response, 201);
		expect(responseData).toEqual({});
	});

	it('should return 500 when fetch fails', async () => {
		// Arrange
		const documentKey = 'airport_new';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

		// Act
		const response = await createAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 500);
		expect(responseData.error).toBe('Network connection failed');
	});

	it('should construct URL with document key from request params', async () => {
		// Arrange
		const documentKey = 'airport@test-123_special';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockResponse({}, 201);
		mockFetch(mockResponse);

		// Act
		await createAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.any(Object)
		);
	});
}); 