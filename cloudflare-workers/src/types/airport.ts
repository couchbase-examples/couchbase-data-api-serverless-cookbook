export interface AirportDocument {
	airportname: string;
	city: string;
	country: string;
	faa: string | null;
	geo: {
		alt: number;
		lat: number;
		lon: number;
	};
	icao: string | null;
	id: number;
	type: string;
	tz: string;
} 