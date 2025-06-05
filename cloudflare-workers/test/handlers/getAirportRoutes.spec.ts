import { describe, it, expect, vi } from 'vitest';
import { getAirportRoutes } from '../../src/handlers/getAirportRoutes';
import {
	mockFetch,
	createMockContext,
	createMockResponse,
	createMockErrorResponse,
	parseResponse,
	expectSuccessResponse,
	expectErrorResponse,
} from '../utils/testHelpers';

describe('getAirportRoutes handler', () => {
	const mockRoutesData = {
		results: [
			{
				sourceairport: 'LAX',
				destinationairport: 'SFO',
				airline: 'UA',
				equipment: '737',
				schedule: [{ day: 1, flight: 'UA1234' }],
			},
			{
				sourceairport: 'SFO',
				destinationairport: 'LAX',
				airline: 'AA',
				equipment: '757',
				schedule: [{ day: 2, flight: 'AA5678' }],
			},
		],
		status: 'success',
		metrics: { resultCount: 2, executionTime: '12.34ms' },
	};

	describe('Success Cases', () => {
		it('should return routes for valid airport code', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectSuccessResponse(response, 200);
			expect(responseData).toEqual(mockRoutesData);
			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/_p/query/query/service'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic'),
						'Content-Type': 'application/json',
					}),
					body: expect.stringContaining(airportCode),
				})
			);
		});

		it('should construct correct SQL query with airport code', async () => {
			// Arrange
			const airportCode = 'SFO';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			await getAirportRoutes(context);

			// Assert
			const fetchCall = (globalThis.fetch as any).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body);
			
			expect(requestBody.statement).toContain('FROM `travel-sample`.inventory.route r');
			expect(requestBody.statement).toContain('WHERE r.sourceairport = ? OR r.destinationairport = ?');
			expect(requestBody.statement).toContain('ORDER BY r.sourceairport, r.destinationairport');
			expect(requestBody.statement).toContain('LIMIT 10');
			expect(requestBody.args).toEqual([airportCode, airportCode]);
		});

		it('should handle case-sensitive airport codes', async () => {
			// Arrange
			const airportCode = 'lax'; // lowercase
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			await getAirportRoutes(context);

			// Assert
			const fetchCall = (globalThis.fetch as any).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body);
			expect(requestBody.args).toEqual(['lax', 'lax']);
		});

		it('should handle empty results from query', async () => {
			// Arrange
			const airportCode = 'XYZ';
			const context = createMockContext({ airportCode });
			const emptyResults = { results: [], status: 'success', metrics: { resultCount: 0 } };
			const mockResponse = createMockResponse(emptyResults);
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectSuccessResponse(response, 200);
			expect(responseData.results).toEqual([]);
			expect(responseData.status).toBe('success');
		});
	});

	describe('Validation Errors', () => {
		it('should return 400 when airportCode parameter is missing', async () => {
			// Arrange
			const context = createMockContext({}); // No path parameters

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 400);
			expect(responseData.error).toBe('Missing required path parameter: airportCode');
			expect(responseData.example).toBe('/airports/LAX/routes');
			expect(globalThis.fetch).not.toHaveBeenCalled();
		});

		it('should return 400 when airportCode parameter is empty string', async () => {
			// Arrange
			const context = createMockContext({ airportCode: '' });

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 400);
			expect(responseData.error).toBe('Missing required path parameter: airportCode');
			expect(globalThis.fetch).not.toHaveBeenCalled();
		});


	});

	describe('Query API Error Cases', () => {
		it('should handle 401 unauthorized error', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockErrorResponse(401, 'Unauthorized', 'Invalid credentials');
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 401);
			expect(responseData.error).toContain('Error executing routes query');
			expect(responseData.error).toContain('Unauthorized');
		});

		it('should handle 500 database error', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockErrorResponse(500, 'Internal Server Error', 'Database connection failed');
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 500);
			expect(responseData.error).toContain('Error executing routes query');
			expect(responseData.error).toContain('Internal Server Error');
		});

		it('should handle syntax error in SQL query', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockErrorResponse(400, 'Bad Request', 'SQL syntax error');
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 400);
			expect(responseData.error).toContain('Error executing routes query');
			expect(responseData.error).toContain('Bad Request');
		});

		it('should handle fetch network errors', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

			// Act
			const response = await getAirportRoutes(context);
			const responseData = await parseResponse(response);

			// Assert
			expectErrorResponse(response, 500);
			expect(responseData.error).toBe('Network timeout');
		});
	});

	describe('Edge Cases', () => {
		it('should handle special characters in airport code', async () => {
			// Arrange
			const airportCode = 'LAX-1'; // Airport code with special character
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			await getAirportRoutes(context);

			// Assert
			const fetchCall = (globalThis.fetch as any).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body);
			expect(requestBody.args).toEqual([airportCode, airportCode]);
		});

		it('should handle very long airport code', async () => {
			// Arrange
			const airportCode = 'VERYLONGAIRPORTCODE123';
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			await getAirportRoutes(context);

			// Assert
			const fetchCall = (globalThis.fetch as any).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body);
			expect(requestBody.args).toEqual([airportCode, airportCode]);
		});

		it('should handle malformed JSON response from query API', async () => {
			// Arrange
			const airportCode = 'LAX';
			const context = createMockContext({ airportCode });
			const mockResponse = new Response('invalid json response', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
			mockFetch(mockResponse);

			// Act
			const response = await getAirportRoutes(context);

			// Assert
			// The response.json() call will fail and should be handled gracefully
			expect(response.status).toBe(500);
		});

		it('should handle query with unicode characters in airport code', async () => {
			// Arrange
			const airportCode = 'LAX™'; // Airport code with unicode
			const context = createMockContext({ airportCode });
			const mockResponse = createMockResponse(mockRoutesData);
			mockFetch(mockResponse);

			// Act
			await getAirportRoutes(context);

			// Assert
			const fetchCall = (globalThis.fetch as any).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body);
			expect(requestBody.args).toEqual([airportCode, airportCode]);
		});
	});
}); 