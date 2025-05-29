// Hotel document type
export interface HotelDocument {
	id: number;
	type: string;
	name: string;
	title?: string;
	description: string;
	country: string;
	city: string;
	state?: string;
	address: string;
	phone?: string;
	geo: {
		lat: number;
		lon: number;
	};
	reviews?: Array<{
		author: string;
		content: string;
		date: string;
		ratings: {
			Cleanliness: number;
			Location: number;
			Overall: number;
			Rooms: number;
			Service: number;
			Value: number;
		};
	}>;
	url?: string;
	amenities?: string[];
	price?: number;
	checkin?: string;
	checkout?: string;
	pets_ok?: boolean;
	free_breakfast?: boolean;
	free_internet?: boolean;
	free_parking?: boolean;
	smoking?: boolean;
	public_likes?: string[];
	vacancy?: boolean;
} 