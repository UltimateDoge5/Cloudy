import { createClient } from "@supabase/supabase-js";
import { useEffect, useReducer, useState } from "react";
import { type Database } from "../../schema";
import { ArrowDownIconSolid, ArrowUpIconSolid } from "./icons";
import dayjs from "dayjs";

export const MonthTemperatures = ({
	history,
	currentTemp,
}: {
	history: {
		temperature: number;
		timestamp: string;
	}[];
	currentTemp: number;
}) => {
	const [error, setError] = useState(false);
	const [monthTemps, setMonthTemps] = useReducer(
		(prev: MonthTemps, next: Partial<MonthTemps>) => ({ ...prev, ...next }),
		{ highest: -256, lowest: 0, highestDate: "", lowestDate: "" },
	);

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		void supabase
			.rpc("get_monthly_stats")
			.single()
			.then(async ({ data, error }) => {
				if (error) {
					setError(true);
					return;
				}

				setMonthTemps(data);

				// Getting the dates in a single query is hard
				// Thechniclly I could do it in a rpc but this is easier
				void supabase
					.from("weather")
					.select("timestamp")
					.order("id", { ascending: false })
					.eq("temperature", data.highest)
					//Not eariler than 1st of the month
					.gte("timestamp", dayjs().startOf("month").toISOString())
					.limit(1)
					.single()
					.then(({ data }) => setMonthTemps({ highestDate: data?.timestamp }));

				void (await supabase
					.from("weather")
					.select("timestamp")
					.order("id", { ascending: false })
					.eq("temperature", data.lowest)
					//Not eariler than 1st of the month
					.gte("timestamp", dayjs().startOf("month").toISOString())
					.limit(1)
					.single()
					.then(({ data }) => setMonthTemps({ lowestDate: data?.timestamp })));
			});
	}, []);

	useEffect(() => {
		if (currentTemp > monthTemps.highest) {
			setMonthTemps({ highest: currentTemp });
		} else if (currentTemp < monthTemps.lowest) {
			setMonthTemps({ lowest: currentTemp });
		}
	}, [currentTemp]);

	if (monthTemps.highest === -256 && history) return <div className="animate-pulse rounded bg-secondary p-2" />;
	if (error)
		return (
			<div className="my-auto flex h-full items-center rounded bg-red-400 p-2 text-xl text-red-800 dark:bg-red-300">
				There was an error while loading current month records.
			</div>
		);

	return (
		<div className="grid grid-cols-2 items-center divide-x divide-white/30 rounded bg-secondary p-2 shadow-inner">
			<div className="flex items-center">
				<ArrowUpIconSolid className="h-8 w-8" />
				<div>
					<p className="text-right text-xs text-text/90">Highest</p>
					<span className="ml-2 text-2xl font-semibold">{monthTemps.highest.toFixed(1)}</span>{" "}
					<sup className="relative -top-1 text-lg">°C</sup>
					<p className="ml-2 h-5 text-sm font-thin">
						{monthTemps.highestDate !== "" &&
							new Date(monthTemps.highestDate).toLocaleString("en-US", {
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
					<p className="ml-2 h-5 text-sm font-thin">
						{monthTemps.highestDate !== "" &&
							new Date(monthTemps.lowestDate).toLocaleString("en-US", {
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

interface MonthTemps {
	highest: number;
	lowest: number;
	highestDate: string;
	lowestDate: string;
}
