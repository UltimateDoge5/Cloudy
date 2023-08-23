import { Chart, registerables } from "chart.js";
import Head from "next/head";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";
import { useEffect, useReducer, useRef } from "react";
import { Database } from "../../schema";
import { DropletIcon } from "../components/icons";

Chart.register(...registerables);

export default function Home() {
	const [current, setCurrent] = useReducer((prev: Row, next: Row) => ({ ...prev, ...next }), {
		temperature: -1,
		pressure: -1,
		humidity: -1,
		timestamp: "",
	});

	const subscriptionRef = useRef<RealtimeChannel>(null);

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		);

		supabase
			.from("weather")
			.select("temperature, pressure, humidity, timestamp")
			.order("id", { ascending: false })
			.limit(1)
			.single()
			.then(({ data }) => setCurrent(data));

		subscriptionRef.current = supabase
			.channel("table-db-changes")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "weather",
				},
				(payload) => {
					const row = payload.new as Row;
					setCurrent(row);
				},
			)
			.subscribe();

		return () => {
			subscriptionRef.current.unsubscribe();
		};
	}, []);

	return (
		<>
			<Head>
				<title>Cloudy</title>
			</Head>

			<main className="m-auto grid h-full w-3/4 grid-cols-3 grid-rows-[128px,_auto] gap-2 p-2">
				<div className="bg-primary text-background rounded p-2">
					<span className="text-6xl font-semibold">{current.temperature.toFixed(1)}</span>
					<sup className="relative -top-5 text-3xl">°C</sup>
				</div>
				<div className="grid grid-rows-2 gap-2">
					<div className="bg-secondary/60 flex items-center gap-2 rounded p-2">
						<DropletIcon className="h-6 w-6" />
						<div>
							<p className="text-right text-xs text-slate-600/50">Air humidity</p>
							<span className="ml-2 text-2xl font-semibold">{current.humidity.toFixed(1)}</span> %
						</div>
						<div>
							<p className="text-right text-xs text-slate-600/50">Dew point</p>
							<span className="ml-2 text-2xl font-semibold">
								{calculateDewPoint(current.temperature, current.humidity).toFixed(1)}
							</span>{" "}
							<sup className="relative -top-1 text-lg">°C</sup>
						</div>
					</div>
					<div className="bg-secondary rounded p-2 text-2xl">
						<div className="w-fit">
							<p className="text-right text-xs text-slate-600/50">Atmospheric pressure</p>
							<span className="ml-2 font-semibold">{current.pressure.toFixed(1)}</span> hPa
						</div>
					</div>
				</div>

				<div className="row-span-2 h-full"></div>
				<div className="col-span-2">
					<canvas />
				</div>
			</main>
		</>
	);
}

const calculateDewPoint = (temperature: number, humidity: number) => {
	const a = 17.27;
	const b = 237.7;
	const t = (a * temperature) / (b + temperature) + Math.log(humidity / 100);
	return (b * t) / (a - t);
};

interface Row {
	temperature: number;
	pressure: number;
	humidity: number;
	timestamp: string;
}
