import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHotelsNearAirport } from '../../src/handlers/getHotelsNearAirport';
import {
	createMockContext,
	createMockResponse,
	createMockErrorResponse,
	parseResponse,
	expectSuccessResponse,
	expectErrorResponse,
} from '../utils/testHelpers';

const mockAirportData = {
	id: 1254,
	faa: 'LAX',
	airportname: 'Los Angeles Intl',
	city: 'Los Angeles',
	country: 'United States',
	geo: {
		lat: 33.942536,
		lon: -118.408075
	}
};

const mockHotelSearchResponse = {
	hits: [
		{
			fields: {
				id: 'hotel_123',
				name: 'Airport Hotel',
				city: 'Los Angeles',
				geo: { lat: 33.943, lon: -118.409 }
			},
			score: 0.95
		}
	],
	total_hits: 1
};

describe('getHotelsNearAirport handler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should validate airportId path parameter', async () => {
		// Arrange
		const context = createMockContext(); // No path parameters

		// Act
		const response = await getHotelsNearAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 400);
		expect(responseData.error).toBe('Missing required path parameters: airportId and distance are both mandatory');
		expect(responseData.example).toBe('/airports/airport_1254/hotels/nearby/50km');
	});

	it('should validate empty airportId path parameter', async () => {
		// Arrange
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return '';
			return undefined;
		});

		// Act
		const response = await getHotelsNearAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expect(response.status).toBe(400);
		expect(responseData.error).toBe('Missing required path parameters: airportId and distance are both mandatory');
	});

	it('should use distance parameter when provided', async () => {
		// Arrange
		const airportId = 'airport_1254';
		const distance = '10km';
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return airportId;
			if (key === 'distance') return distance;
			return undefined;
		});
		
		globalThis.fetch = vi.fn()
			.mockResolvedValueOnce(createMockResponse(mockAirportData, 200))
			.mockResolvedValueOnce(createMockResponse(mockHotelSearchResponse, 200));

		// Act
		await getHotelsNearAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		const secondCall = (globalThis.fetch as any).mock.calls[1];
		const ftsRequestBody = JSON.parse(secondCall[1].body);
		expect(ftsRequestBody.query.distance).toBe(distance);
	});

	it('should return 404 when airport not found', async () => {
		// Arrange
		const airportId = 'nonexistent_airport';
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return airportId;
			return undefined;
		});
		
		globalThis.fetch = vi.fn().mockResolvedValueOnce(
			createMockErrorResponse(404, 'Not Found', 'Document not found')
		);

		// Act
		const response = await getHotelsNearAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 404);
		expect(responseData.error).toBe(`Airport not found: ${airportId}`);
		expect(responseData.detail).toBe('No airport document found with the specified document ID');
		expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Only airport call, no hotel search
	});

	it('should make API call with correct airport endpoint', async () => {
		// Arrange
		const airportId = 'airport_1254';
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return airportId;
			return undefined;
		});
		
		globalThis.fetch = vi.fn()
			.mockResolvedValueOnce(createMockResponse(mockAirportData, 200))
			.mockResolvedValueOnce(createMockResponse(mockHotelSearchResponse, 200));

		// Act
		await getHotelsNearAirport(context);

		// Assert
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		
		// First call: Get airport document
		expect(globalThis.fetch).toHaveBeenNthCalledWith(1,
			expect.stringContaining(`/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents/${airportId}`),
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Authorization': expect.stringContaining('Basic'),
				}),
			})
		);
	});

	it('should format response with airport and hotel data', async () => {
		// Arrange
		const airportId = 'airport_1254';
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return airportId;
			return undefined;
		});
		
		globalThis.fetch = vi.fn()
			.mockResolvedValueOnce(createMockResponse(mockAirportData, 200))
			.mockResolvedValueOnce(createMockResponse(mockHotelSearchResponse, 200));

		// Act
		const response = await getHotelsNearAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectSuccessResponse(response, 200);
		expect(responseData).toHaveProperty('airport');
		expect(responseData.airport.id).toBe(airportId);
		expect(responseData.airport.code).toBe(mockAirportData.faa);
		expect(responseData.airport.name).toBe(mockAirportData.airportname);
		expect(responseData.airport.coordinates.latitude).toBe(mockAirportData.geo.lat);
		expect(responseData.airport.coordinates.longitude).toBe(mockAirportData.geo.lon);
		
		expect(responseData).toHaveProperty('search_criteria');
		expect(responseData).toHaveProperty('total_hotels_found', 1);
		expect(responseData).toHaveProperty('hotels');
		expect(responseData.hotels).toHaveLength(1);
	});

	it('should handle network errors gracefully', async () => {
		// Arrange
		const airportId = 'airport_1254';
		const context = createMockContext();
		context.req.param.mockImplementation((key: string) => {
			if (key === 'airportId') return airportId;
			return undefined;
		});
		
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

		// Act
		const response = await getHotelsNearAirport(context);
		const responseData = await parseResponse(response);

		// Assert
		expectErrorResponse(response, 500);
		expect(responseData.error).toBe('Network connection failed');
		expect(responseData.note).toContain('Full Text Search index');
	});
}); 