import { createClient } from "@supabase/supabase-js";
import { useEffect, useReducer } from "react";
import { type Database } from "../../schema";
import { ArrowDownIconSolid, ArrowUpIconSolid } from "./icons";

export const MonthTemperatures = ({ currentTemp }: { currentTemp: number }) => {
	const [monthTemps, setMonthTemps] = useReducer(
		(prev: MonthTemps, next: Partial<MonthTemps>) => ({ ...prev, ...next }),
		{ highest: -256, lowest: 0, highest_date: "", lowest_date: "" },
	);

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		void supabase
			.rpc("get_monthly_stats")
			.single()
			.then(({ data }) => setMonthTemps(data!));
	}, []);

	useEffect(() => {
		if (currentTemp > monthTemps.highest) {
			setMonthTemps({ highest: currentTemp });
		} else if (currentTemp < monthTemps.lowest) {
			setMonthTemps({ lowest: currentTemp });
		}
	}, [currentTemp]);

	if (monthTemps.highest === -256) return <div className="animate-pulse rounded bg-secondary p-2" />;

	return (
		<div className="grid grid-cols-2 items-center divide-x divide-white/30 rounded bg-secondary p-2 shadow-inner">
			<div className="flex items-center">
				<ArrowUpIconSolid className="h-8 w-8" />
				<div>
					<p className="text-right text-xs text-text/90">Highest</p>
					<span className="ml-2 text-2xl font-semibold">{monthTemps.highest.toFixed(1)}</span>{" "}
					<sup className="relative -top-1 text-lg">°C</sup>
					<p className="ml-2 text-xs font-thin">
						{new Date(monthTemps.highest_date).toLocaleString("en-US", {
							weekday: "short",
							day: "numeric",
							hour: "numeric",
							minute: "numeric",
							hour12: false,
						})}
					</p>
				</div>
			</div>
			<div className="flex items-center px-2">
				<ArrowDownIconSolid className="h-8 w-8" />
				<div>
					<p className="text-right text-xs text-text/90">Lowest</p>
					<span className="ml-2 text-2xl font-semibold">{monthTemps.lowest.toFixed(1)}</span>
					<sup className="relative -top-1 text-lg">°C</sup>
					<p className="ml-2 text-xs font-thin">
						{new Date(monthTemps.lowest_date).toLocaleString("en-US", {
							weekday: "short",
							day: "numeric",
							hour: "numeric",
							minute: "numeric",
							hour12: false,
						})}
					</p>
				</div>
			</div>
		</div>
	);
};

type MonthTemps = Database["public"]["Functions"]["get_monthly_stats"]["Returns"][number];
