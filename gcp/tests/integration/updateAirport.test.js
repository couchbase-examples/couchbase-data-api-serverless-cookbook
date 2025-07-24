describe('PUT /airports/{airportId} - Update Airport', () => {
    let apiBaseUrl;
    const testAirportId = `TEST_UPDATE_AIRPORT`;

    beforeAll(async () => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();

        // Create a test airport first
        const airportData = {
            id: testAirportId,
            airportname: 'Test Update Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        await fetch(`${apiBaseUrl}/airports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
    });

    afterAll(async () => {
        try {
            await fetch(`${apiBaseUrl}/airports/TEST_AIRPORT`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn(`Failed to cleanup airport:`, error);
        }
    });

    test('should update airport successfully with valid data', async () => {
        const updatedData = {
            airportname: 'Updated Test Airport',
            city: 'Updated Test City',
            country: 'Updated Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/New_York',
            geo: {
                lat: 40.7128,
                lon: -74.0060,
                alt: 10
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
    });

    test('should handle partial updates', async () => {
        const partialData = {
            airportname: 'Partially Updated Airport'
        };

        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partialData)
        });
        
        expect([200, 400]).toContain(response.status);
    });
}); 