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
			get_monthly_stats: {
				Args: Record<PropertyKey, never>;
				Returns: {
					lowest: number;
					highest: number;
				}[];
			};
			get_month_summary: {
				Args: {
					input_timestamp: string;
				};
				Returns: {
					day: string;
					max_temp: number;
					min_temp: number;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
