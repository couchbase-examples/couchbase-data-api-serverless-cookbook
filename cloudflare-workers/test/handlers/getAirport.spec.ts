import { describe, it, expect, vi } from 'vitest';
import { getAirport } from '../../src/handlers/getAirport';
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

describe('getAirport handler', () => {
	describe('Success Cases', () => {
		it('should return airport data with id when document exists', async () => {
			// Arrange
			const airportId = 'airport_1254';
			const context = createMockContext({ airportId });
			const mockResponse = createMockResponse(mockAirportData);
			mockFetch(mockResponse);

			// Act
			const response = await getAirport(context);
			const responseData = await parseResponse(response);

			// Assert
			expectSuccessResponse(response, 200);
			expect(responseData).toEqual({
				...mockAirportData,
				id: airportId
			});
			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${airportId}`),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic'),
						'Content-Type': 'application/json',
					}),
				})
			);
		});

		it('should construct correct URL with airport ID', async () => {
			// Arrange
			const airportId = 'test_airport_123';
			const context = createMockContext({ airportId });
			const mockResponse = createMockResponse(mockAirportData);
			mockFetch(mockResponse);

			// Act
			await getAirport(context);

			// Assert
			expect(globalThis.fetch).toHaveBeenCalledWith(
				'https://test.endpoint.com/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/test_airport_123',
				expect.any(Object)
			);
		});
	});

	describe('Error Cases', () => {
		it('should handle 404 when document does not exist', async () => {
			// Arrange
			const airportId = 'nonexistent_airport';
			const context = createMockContext({ airportId });
			const mockResponse = createMockErrorResponse(404, 'Not Found', 'Document not found');
			mockFetch(mockResponse);

			// Act
			const response = await getAirport(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 404);
			expect(responseData.error).toContain('Error fetching airport data');
			expect(responseData.error).toContain('Not Found');
		});

		it('should handle 401 unauthorized error', async () => {
			// Arrange
			const airportId = 'airport_1254';
			const context = createMockContext({ airportId });
			const mockResponse = createMockErrorResponse(401, 'Unauthorized', 'Invalid credentials');
			mockFetch(mockResponse);

			// Act
			const response = await getAirport(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 401);
			expect(responseData.error).toContain('Error fetching airport data');
			expect(responseData.error).toContain('Unauthorized');
		});

		it('should handle 500 server error', async () => {
			// Arrange
			const airportId = 'airport_1254';
			const context = createMockContext({ airportId });
			const mockResponse = createMockErrorResponse(500, 'Internal Server Error');
			mockFetch(mockResponse);

			// Act
			const response = await getAirport(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 500);
			expect(responseData.error).toContain('Error fetching airport data');
		});

		it('should handle fetch network errors', async () => {
			// Arrange
			const airportId = 'airport_1254';
			const context = createMockContext({ airportId });
			globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			// Act
			const response = await getAirport(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 500);
			expect(responseData.error).toBe('Network error');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty airport ID', async () => {
			// Arrange
			const context = createMockContext({ airportId: '' });
			const mockResponse = createMockResponse(mockAirportData);
			mockFetch(mockResponse);

			// Act
			await getAirport(context);

			// Assert
			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/'),
				expect.any(Object)
			);
		});

		it('should handle special characters in airport ID', async () => {
			// Arrange
			const airportId = 'airport@test-123_special';
			const context = createMockContext({ airportId });
			const mockResponse = createMockResponse(mockAirportData);
			mockFetch(mockResponse);

			// Act
			await getAirport(context);

			// Assert
			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${airportId}`),
				expect.any(Object)
			);
		});

		it('should handle invalid JSON response from API', async () => {
			// Arrange
			const airportId = 'airport_1254';
			const context = createMockContext({ airportId });
			const mockResponse = new Response('invalid json', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
			mockFetch(mockResponse);

			// Act
			const response = await getAirport(context);

			// Assert
			// Should handle gracefully - the response.json() will throw but should be caught
			expect(response.status).toBe(500);
		});
	});
}); 