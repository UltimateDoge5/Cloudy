import { Chart, registerables } from "chart.js";
import Head from "next/head";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useReducer, useRef, useState } from "react";
import { Database } from "../../schema";
import { CloudIcon, DropletIcon } from "../components/icons";
import { Line } from "react-chartjs-2";
import { Uptime } from "../components/uptime";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm.js";

Chart.register(...registerables);

export default function Home() {
	const [current, setCurrent] = useReducer((prev: Row, next: Partial<Row>) => ({ ...prev, ...next }), {
		temperature: 0,
		pressure: 0,
		humidity: 0,
		timestamp: "",
	});

	const [history, setHistory] = useState<Row[]>([]);
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

	const chartRef = useRef<ChartJSOrUndefined<"line", string[], number> | undefined>(undefined);

	const subscriptionRef = useRef<RealtimeChannel | null>(null);

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		void supabase
			.from("weather")
			.select("temperature, pressure, humidity, timestamp")
			.order("id", { ascending: false })
			.limit(1)
			.single()
			.then(({ data }) => setCurrent(data!)); //Data is never null

		void supabase
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
					const now = new Date().getTime();
					const newHistory = [...history, row].filter(
						(r) => new Date(r.timestamp).getTime() > now - 24 * 60 * 60 * 1000,
					);
					setHistory(newHistory);
					setCurrent(row);
				},
			)
			.subscribe();

		return () => {
			void subscriptionRef.current?.unsubscribe();
		};
	}, []);

	// Perform the update of the chart manually
	// The component param one causes flashing
	useEffect(() => {
		if (chartRef.current) {
			chartRef.current.data.labels = history.map((r) => new Date(r.timestamp).getTime());
			chartRef.current.data.datasets[0].data = history.map((r) => r.temperature.toFixed(2));
			chartRef.current.data.datasets[1].data = history.map((r) => r.humidity.toFixed(2));
			chartRef.current.data.datasets[2].data = history.map((r) => r.pressure.toFixed(2));
			chartRef.current.update();
		}
	}, [history]);

	return (
		<>
			<Head>
				<title>Cloudy | Weather station</title>
			</Head>

			<main className="m-auto grid h-full w-4/5 grid-cols-1 grid-rows-[128px,_auto] gap-2 p-2 md:grid-cols-[0.8fr_1fr_1.2fr]">
				<div
					className={`rounded bg-primary p-2 text-background ${
						current.timestamp === "" ? "animate-pulse" : ""
					}`}
				>
					{current.timestamp !== "" && (
						<>
							<span className="text-7xl font-semibold">{current.temperature.toFixed(1)}</span>
							<sup className="relative -top-6 text-4xl">°C</sup>
							<p className="mt-2">
								Last update was at
								<span className="ml-1 font-semibold">
									{new Date(current.timestamp).toLocaleString("en-us", {
										hour: "numeric",
										minute: "numeric",
										second: "numeric",
										hour12: false,
									})}
								</span>
							</p>
						</>
					)}
				</div>
				<div className="grid grid-rows-2 gap-2">
					<div className="flex items-center gap-2 rounded bg-secondary/70 p-2 shadow-inner">
						{current.timestamp !== "" && (
							<>
								<DropletIcon className="h-6 w-6" />
								<div>
									<p className="text-right text-xs text-slate-600/60">Air humidity</p>
									<span className="ml-2 text-2xl font-semibold">{current.humidity.toFixed(1)}</span> %
								</div>
								<div>
									<p className="text-right text-xs text-slate-600/60">Dew point</p>
									<span className="ml-2 text-2xl font-semibold">
										{calculateDewPoint(current.temperature, current.humidity).toFixed(1)}
									</span>{" "}
									<sup className="relative -top-1 text-lg">°C</sup>
								</div>
							</>
						)}
					</div>
					<div className="flex items-center gap-2 rounded bg-secondary p-2 text-2xl shadow-inner">
						{current.timestamp !== "" && (
							<>
								<CloudIcon className="h-6 w-6" />
								<div className="w-fit">
									<p className="text-right text-xs text-slate-600/60">Atmospheric pressure</p>
									<span className="ml-2 font-semibold">{current.pressure.toFixed(1)}</span> hPa
								</div>
							</>
						)}
					</div>
				</div>

				<div className="row-span-2 ml-6 h-full">
					<h1 className="text-3xl">Device status</h1>
					<div className="flex flex-col gap-2">
						Average interval between updates is{" "}
						{history.length > 0 && (calcAvgInterval(history.map((r) => r.timestamp)) / 1000).toFixed(2)}{" "}
						seconds
						<div>
							<span className="font-semibold">{history.length}</span> records in the last 24 hours
						</div>
						<div className="relative top-6">
							<h2 className="text-xl">Uptime in the last 24 hours</h2>
							<Uptime timestamps={history.map((r) => r.timestamp)} />
						</div>
					</div>
				</div>
				<div className="col-span-2 pt-4">
					{history?.length > 0 ? (
						<Line
							ref={chartRef}
							className="h-full w-full"
							data={{
								labels: history.map((r) => new Date(r.timestamp).getTime()),
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
								animation: false,
								color: "#010905",
								elements: {
									point: {
										radius: 0,
									},
								},
								scales: {
									x: {
										type: "timeseries",
										time: {
											unit: "hour",
											displayFormats: {
												hour: "HH:mm",
											},
										},
									},
									y: {
										type: "linear",
										display: scales.y,
										position: "left",
										grid: {
											drawOnChartArea: false,
										},
										ticks: {
											callback: (value) => value + "°C",
										},
									},
									y1: {
										type: "linear",
										position: "right",
										display: scales.y1,
										max: 100,
										min: 0,
										grid: {
											drawOnChartArea: false,
										},
										ticks: {
											callback: (value) => value + "%",
										},
									},
									y2: {
										type: "linear",
										display: scales.y2,
										grid: {
											drawOnChartArea: false,
										},
									},
								},
								plugins: {
									legend: {
										onClick: (_e, l) => {
											const index = l.datasetIndex;
											if (index === undefined) return;
											// Set y, y1 or y2
											const key = Object.keys(scales)[index] as keyof Scales;
											setScales({ [key]: !scales[key] });
										},
									},
									decimation: {
										enabled: true,
										algorithm: "lttb",
										samples: 100,
									},
								},
							}}
						/>
					) : (
						<div className="mt-2 h-52 w-full animate-pulse rounded bg-secondary/40" />
					)}
				</div>
			</main>
		</>
	);
}

const calcAvgInterval = (timestamps: string[]) => {
	let sum = 0;
	for (let i = 0; i < timestamps.length - 1; i++) {
		const diff = new Date(timestamps[i + 1]).getTime() - new Date(timestamps[i]).getTime();
		sum += diff;
	}
	return sum / timestamps.length;
};

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
