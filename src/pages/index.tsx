import { Chart, registerables } from "chart.js";
import Head from "next/head";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";
import { useEffect, useReducer, useRef, useState } from "react";
import { Database } from "../../schema";
import { DropletIcon } from "../components/icons";
import { Line } from "react-chartjs-2";

Chart.register(...registerables);

export default function Home() {
	const [current, setCurrent] = useReducer((prev: Row, next: Partial<Row>) => ({ ...prev, ...next }), {
		temperature: -1,
		pressure: -1,
		humidity: -1,
		timestamp: "",
	});

	const [scales, setScales] = useReducer(
		(prev: Scales, next: Partial<Scales>) => ({
			...prev,
			...next,
		}),
		{
			y: true,
			y1: true,
			y2: false,
		},
	);

	const [history, setHistory] = useState<Row[]>([]);

	const subscriptionRef = useRef<RealtimeChannel | null>(null);

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		supabase
			.from("weather")
			.select("temperature, pressure, humidity, timestamp")
			.order("id", { ascending: false })
			.limit(1)
			.single()
			.then(({ data }) => setCurrent(data!)); //Data is never null

		supabase
			.from("weather")
			.select("temperature, pressure,humidity, timestamp")
			.order("id", { ascending: true })
			// Show only last 24 hours
			.gt("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
			.then(({ data }) => setHistory(data!));

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
			subscriptionRef.current?.unsubscribe();
		};
	}, []);

	return (
		<>
			<Head>
				<title>Cloudy</title>
			</Head>

			<main className="m-auto grid h-full w-3/4 grid-cols-3 grid-rows-[128px,_auto] gap-2 p-2">
				<div className="rounded bg-primary p-2 text-background">
					<span className="text-6xl font-semibold">{current.temperature.toFixed(1)}</span>
					<sup className="relative -top-5 text-3xl">°C</sup>
				</div>
				<div className="grid grid-rows-2 gap-2">
					<div className="flex items-center gap-2 rounded bg-secondary/60 p-2">
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
					<div className="rounded bg-secondary p-2 text-2xl">
						<div className="w-fit">
							<p className="text-right text-xs text-slate-600/50">Atmospheric pressure</p>
							<span className="ml-2 font-semibold">{current.pressure.toFixed(1)}</span> hPa
						</div>
					</div>
				</div>

				<div className="row-span-2 h-full"></div>
				<div className="col-span-2 pt-4">
					{history?.length > 0 && (
						<Line
							data={{
								labels: history.map((r) =>
									new Date(r.timestamp).toLocaleString("en-us", {
										hour: "numeric",
										minute: "numeric",
										second: "numeric",
										hour12: false,
									}),
								),
								datasets: [
									{
										data: history.map((r) => r.temperature.toFixed(2)),
										label: "Temperature",
										tension: 0.1,
										hidden: !scales.y,
									},
									{
										data: history.map((r) => r.humidity.toFixed(2)),
										label: "Humidity",
										yAxisID: "y1",
										tension: 0.1,
										hidden: !scales.y1,
									},
									{
										data: history.map((r) => r.pressure.toFixed(2)),
										label: "Pressure",
										yAxisID: "y2",
										tension: 0.1,
										hidden: !scales.y2,
									},
								],
							}}
							options={{
								elements: {
									point: {
										radius: 0,
									},
								},
								scales: {
									y: {
										type: "linear",
										display: scales.y,
										position: "left",
										grid: {
											drawOnChartArea: false,
										},
									},
									y1: {
										type: "linear",
										position: "right",
										display: scales.y1,
										ticks: {},
										grid: {
											drawOnChartArea: false,
										},
									},
									y2: {
										type: "linear",
										display: scales.y2,
										grid: {
											drawOnChartArea: false,
										},
										// max: 1015,
									},
								},
								plugins: {
									legend: {
										onClick: (e, v, g) => {
											const index = v.datasetIndex;
											// Set y, y1 or y2
											const key = `y${index || ""}` as keyof Scales;
											setScales({ [key]: !scales[key] });
										},
									},
								},
							}}
						/>
					)}
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

interface Scales {
	y: boolean;
	y1: boolean;
	y2: boolean;
}
