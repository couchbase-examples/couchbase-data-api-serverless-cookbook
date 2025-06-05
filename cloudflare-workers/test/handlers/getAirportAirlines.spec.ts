import { describe, it, expect, vi } from 'vitest';
import { getAirportAirlines } from '../../src/handlers/getAirportAirlines';
import {
	mockFetch,
	createMockContext,
	createMockResponse,
	createMockErrorResponse,
	parseResponse,
	expectSuccessResponse,
	expectErrorResponse,
} from '../utils/testHelpers';

describe('getAirportAirlines handler', () => {
	it('should make correct query request with airport code', async () => {
		// Arrange
		const airportCode = 'LAX';
		const context = createMockContext({ airportCode });
		const mockQueryResult = {
			results: [
				{ airline: 'American Airlines' },
				{ airline: 'United Airlines' }
			]
		};
		const mockResponse = createMockResponse(mockQueryResult, 200);
		mockFetch(mockResponse);

		// Act
		const response = await getAirportAirlines(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/_p/query/query/service'),
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Authorization': expect.stringContaining('Basic'),
					'Content-Type': 'application/json',
				}),
				body: expect.stringContaining('travel-sample'),
			})
		);
		expectSuccessResponse(response, 200);
	});

	it('should construct correct SQL query with airport code parameters', async () => {
		// Arrange
		const airportCode = 'JFK';
		const context = createMockContext({ airportCode });
		const mockResponse = createMockResponse({}, 200);
		mockFetch(mockResponse);

		// Act
		await getAirportAirlines(context);

		// Assert
		const callArgs = (globalThis.fetch as any).mock.calls[0];
		const requestBody = JSON.parse(callArgs[1].body);
		
		expect(requestBody.statement).toContain('SELECT DISTINCT r.airline');
		expect(requestBody.statement).toContain('FROM `travel-sample`.inventory.route r');
		expect(requestBody.statement).toContain('WHERE r.sourceairport = ? OR r.destinationairport = ?');
		expect(requestBody.statement).toContain('ORDER BY r.airline');
		expect(requestBody.args).toEqual([airportCode, airportCode]);
	});

	it('should return 400 when airportCode path parameter is missing', async () => {
		// Arrange
		const context = createMockContext({}); // No path parameters

		// Act
		const response = await getAirportAirlines(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toBe('Missing required path parameter: airportCode');
		expect(responseData.example).toBe('/airports/LAX/airlines');
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should handle different airport codes', async () => {
		// Arrange
		const airportCode = 'SFO';
		const context = createMockContext({ airportCode });
		const mockResponse = createMockResponse({ results: [] }, 200);
		mockFetch(mockResponse);

		// Act
		await getAirportAirlines(context);

		// Assert
		const callArgs = (globalThis.fetch as any).mock.calls[0];
		const requestBody = JSON.parse(callArgs[1].body);
		expect(requestBody.args).toEqual([airportCode, airportCode]);
	});

	it('should forward API response data', async () => {
		// Arrange
		const airportCode = 'DEN';
		const context = createMockContext({ airportCode });
		const mockQueryResult = {
			results: [
				{ airline: 'Southwest Airlines' },
				{ airline: 'Frontier Airlines' }
			],
			metrics: { resultCount: 2 }
		};
		const mockResponse = createMockResponse(mockQueryResult, 200);
		mockFetch(mockResponse);

		// Act
		const response = await getAirportAirlines(context);
		const responseData = await parseResponse(response);

		// Assert
		expectSuccessResponse(response, 200);
		expect(responseData).toEqual(mockQueryResult);
	});

	it('should forward API error response', async () => {
		// Arrange
		const airportCode = 'LAX';
		const context = createMockContext({ airportCode });
		const mockResponse = createMockErrorResponse(400, 'Bad Request', 'Invalid query syntax');
		mockFetch(mockResponse);

		// Act
		const response = await getAirportAirlines(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toContain('Error executing airlines query');
		expect(responseData.error).toContain('Bad Request');
		expect(responseData.error).toContain('Invalid query syntax');
	});

	it('should return 500 when fetch fails', async () => {
		// Arrange
		const airportCode = 'LAX';
		const context = createMockContext({ airportCode });
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

		// Act
		const response = await getAirportAirlines(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 500);
		expect(responseData.error).toBe('Network connection failed');
	});

	it('should handle special characters in airport code', async () => {
		// Arrange
		const airportCode = 'A@B-123';
		const context = createMockContext({ airportCode });
		const mockResponse = createMockResponse({}, 200);
		mockFetch(mockResponse);

		// Act
		await getAirportAirlines(context);

		// Assert
		const callArgs = (globalThis.fetch as any).mock.calls[0];
		const requestBody = JSON.parse(callArgs[1].body);
		expect(requestBody.args).toEqual([airportCode, airportCode]);
	});
}); 