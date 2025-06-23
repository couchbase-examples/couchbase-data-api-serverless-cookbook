describe('POST /airports/{airportId} - Create Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should create airport successfully with valid data', async () => {
        const airportId = `TEST${Date.now()}`;
        const airportData = {
            airportname: 'Test Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: airportId,
            icao: `I${airportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
        
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toBeDefined();
    });

    test('should return 400 for missing required fields', async () => {
        const airportId = `INVALID${Date.now()}`;
        const invalidData = {
            airportname: 'Test Airport'
            // Missing other required fields
        };

        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidData)
        });
        
        expect(response.status).toBe(400);
    });

    test('should return 400 for invalid data types', async () => {
        const airportId = `INVALID${Date.now()}`;
        const invalidData = {
            airportname: 123, // Should be string
            city: 'Test City',
            country: 'Test Country',
            faa: airportId,
            icao: `I${airportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 'invalid', // Should be number
                lon: -122.4194,
                alt: 13
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidData)
        });
        
        expect(response.status).toBe(400);
    });

    test('should return 409 for duplicate airport ID', async () => {
        const airportId = 'SFO'; // Assuming this exists
        const airportData = {
            airportname: 'Duplicate Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: airportId,
            icao: `I${airportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
        
        expect([409, 400]).toContain(response.status);
    });

    test('should handle empty request body', async () => {
        const airportId = `EMPTY${Date.now()}`;

        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        expect(response.status).toBe(400);
    });
}); 