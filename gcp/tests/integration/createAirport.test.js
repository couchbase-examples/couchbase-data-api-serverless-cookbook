describe('POST /airports - Create Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    afterEach(async () => {
        try {
            await fetch(`${apiBaseUrl}/airports/TEST_AIRPORT`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn(`Failed to cleanup airport:`, error);
        }
    });

    test('should create airport successfully with valid data', async () => {
        const airportData = {
            id: 'TEST_AIRPORT',
            airportname: 'Test Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: 'TEST_AIRPORT',
            icao: 'ITEST_AIRPORT',
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports`, {
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

    test('should return 400 for missing id in request body', async () => {
        const airportData = {
            airportname: 'Test Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: 'TST',
            icao: 'ITST',
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
        
        expect(response.status).toBe(400);
        const responseText = await response.text();
        expect(responseText).toContain('Missing required attribute: id');
    });

    test('should return 409 for duplicate airport ID', async () => {
        const airportId = 'SFO';
        const airportData = {
            id: airportId,
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

        const response = await fetch(`${apiBaseUrl}/airports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
        
        expect([409, 400]).toContain(response.status);
    });
}); 