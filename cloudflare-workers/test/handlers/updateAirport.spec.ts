import { describe, it, expect, vi } from 'vitest';
import { updateAirport } from '../../src/handlers/updateAirport';
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

describe('updateAirport handler', () => {
	it('should parse request body and make correct PUT request', async () => {
		// Arrange
		const documentKey = 'airport_update';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockResponse({ message: 'Updated' }, 200);
		mockFetch(mockResponse);

		// Act
		const response = await updateAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.objectContaining({
				method: 'PUT',
				headers: expect.objectContaining({
					'Authorization': expect.stringContaining('Basic'),
					'Content-Type': 'application/json',
				}),
				body: JSON.stringify(mockAirportData),
			})
		);
		expectSuccessResponse(response, 200);
	});

	it('should handle custom airport data in request body', async () => {
		// Arrange
		const documentKey = 'custom_airport';
		const customAirportData = {
			...mockAirportData,
			airportname: 'Updated Airport',
			faa: 'UPD',
			id: 9999,
		};
		const context = createMockContext({ documentKey }, {}, customAirportData);
		const mockResponse = createMockResponse({}, 200);
		mockFetch(mockResponse);

		// Act
		await updateAirport(context);

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
		const documentKey = 'airport_update';
		const context = createMockContext({ documentKey });
		context.req.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

		// Act
		const response = await updateAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toBe('Invalid JSON in request body for airport update');
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should forward API response status and error message', async () => {
		// Arrange
		const documentKey = 'test_airport';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockErrorResponse(404, 'Not Found', 'Document not found');
		mockFetch(mockResponse);

		// Act
		const response = await updateAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 404);
		expect(responseData.error).toContain('Error updating airport document');
		expect(responseData.error).toContain('Not Found');
		expect(responseData.error).toContain('Document not found');
	});

	it('should handle API response without JSON body', async () => {
		// Arrange
		const documentKey = 'airport_update';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = new Response('', {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
		mockFetch(mockResponse);

		// Act
		const response = await updateAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectSuccessResponse(response, 200);
		expect(responseData).toEqual({ message: 'Airport Updated Successfully' });
	});

	it('should handle 204 No Content response', async () => {
		// Arrange
		const documentKey = 'airport_update';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = new Response('', {
			status: 204,
			headers: { 'Content-Type': 'application/json' },
		});
		mockFetch(mockResponse);

		// Act
		const response = await updateAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectSuccessResponse(response, 200);
		expect(responseData).toEqual({ message: 'Airport Updated Successfully' });
	});

	it('should return 500 when fetch fails', async () => {
		// Arrange
		const documentKey = 'airport_update';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

		// Act
		const response = await updateAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 500);
		expect(responseData.error).toBe('Network connection failed');
	});

	it('should construct URL with document key from request params', async () => {
		// Arrange
		const documentKey = 'airport@update-123';
		const context = createMockContext({ documentKey }, {}, mockAirportData);
		const mockResponse = createMockResponse({}, 200);
		mockFetch(mockResponse);

		// Act
		await updateAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.any(Object)
		);
	});
}); 