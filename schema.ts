export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			weather: {
				Row: {
					humidity: number;
					id: number;
					pressure: number;
					temperature: number;
					timestamp: string;
				};
				Insert: {
					humidity: number;
					id?: number;
					pressure: number;
					temperature: number;
					timestamp?: string;
				};
				Update: {
					humidity?: number;
					id?: number;
					pressure?: number;
					temperature?: number;
					timestamp?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
