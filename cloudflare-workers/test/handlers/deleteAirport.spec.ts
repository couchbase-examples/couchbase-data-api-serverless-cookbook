import { describe, it, expect, vi } from 'vitest';
import { deleteAirport } from '../../src/handlers/deleteAirport';
import {
	mockFetch,
	createMockContext,
	createMockResponse,
	createMockErrorResponse,
	parseResponse,
	expectErrorResponse,
} from '../utils/testHelpers';

describe('deleteAirport handler', () => {
	it('should make correct DELETE request', async () => {
		// Arrange
		const documentKey = 'airport_delete';
		const context = createMockContext({ documentKey });
		const mockResponse = createMockResponse({ message: `Airport document ${documentKey} deleted successfully.` }, 200);
		mockFetch(mockResponse);

		// Act
		const response = await deleteAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.objectContaining({
				method: 'DELETE',
				headers: expect.objectContaining({
					'Authorization': expect.stringContaining('Basic'),
					'Content-Type': 'application/json',
				}),
			})
		);
		expect(response.status).toBe(200);
	});

	it('should handle 204 No Content response', async () => {
		// Arrange
		const documentKey = 'airport_delete';
		const context = createMockContext({ documentKey });
		const mockResponse = new Response('', { status: 204 });
		mockFetch(mockResponse);

		// Act
		const response = await deleteAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expect(response.status).toBe(200);
		expect(responseData.message).toBe(`Airport document ${documentKey} deleted successfully.`);
	});

	it('should return success message for 200 response', async () => {
		// Arrange
		const documentKey = 'airport_delete';
		const context = createMockContext({ documentKey });
		const mockResponse = createMockResponse({}, 200);
		mockFetch(mockResponse);

		// Act
		const response = await deleteAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expect(response.status).toBe(200);
		expect(responseData.message).toBe(`Airport document ${documentKey} deleted successfully.`);
	});

	it('should forward API response status and error message', async () => {
		// Arrange
		const documentKey = 'nonexistent_airport';
		const context = createMockContext({ documentKey });
		const mockResponse = createMockErrorResponse(404, 'Not Found', 'Document not found');
		mockFetch(mockResponse);

		// Act
		const response = await deleteAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 404);
		expect(responseData.error).toContain('Error deleting airport document');
		expect(responseData.error).toContain('Not Found');
		expect(responseData.error).toContain('Document not found');
	});

	it('should return 500 when fetch fails', async () => {
		// Arrange
		const documentKey = 'airport_delete';
		const context = createMockContext({ documentKey });
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

		// Act
		const response = await deleteAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 500);
		expect(responseData.error).toBe('Network connection failed');
	});

	it('should construct URL with document key from request params', async () => {
		// Arrange
		const documentKey = 'airport@delete-123';
		const context = createMockContext({ documentKey });
		const mockResponse = new Response('', { status: 204 });
		mockFetch(mockResponse);

		// Act
		await deleteAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${documentKey}`),
			expect.any(Object)
		);
	});
}); 