import { Switch } from "@headlessui/react";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";
import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Colors,
	Decimation,
	Legend,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	TimeSeriesScale,
	Tooltip,
} from "chart.js";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm.js";
import dayjs from "dayjs";
import Head from "next/head";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { Database } from "../../schema";
import { CloudIcon, DropletIcon } from "../components/icons";
import { MonthTemperatures } from "../components/monthTemps";
import { Uptime } from "../components/uptime";
import Link from "next/link";

Chart.register(
	BarController,
	BarElement,
	LineController,
	LineElement,
	LinearScale,
	CategoryScale,
	PointElement,
	TimeSeriesScale,
	Decimation,
	Tooltip,
	Legend,
	Colors,
);

export default function Home() {
	const [current, setCurrent] = useReducer(
		(prev: Omit<Row, "id">, next: Partial<Omit<Row, "id">>) => ({ ...prev, ...next }),
		{
			temperature: 0,
			pressure: 0,
			humidity: 0,
			timestamp: "",
		},
	);

	const [gapsEnabled, setGapsEnabled] = useState(true);

	const [dayHistory, setDayHistory] = useState<Row[]>([]);
	const historyWithGaps = useMemo(() => visualizeTimeGaps(visualizeIDGaps(dayHistory)), [dayHistory]);

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

	const chartRef = useRef<ChartJSOrUndefined<"line", (string | undefined)[], number>>(undefined);
	const subscriptionRef = useRef<RealtimeChannel | null>(null);

	const dataPointPercent = dayHistory.filter((r) => r.temperature !== null).length / 4320;
	const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : undefined;

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
			.select("id, temperature, pressure, humidity, timestamp")
			.order("id", { ascending: true })
			// Show only last 24 hours
			.gt("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
			.then(({ data, error }) => {
				if (error) console.error(error);
				setDayHistory(data ?? []);
			});

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
					setDayHistory((prev) => [
						...prev.filter((r) => dayjs(r.timestamp).isAfter(dayjs().subtract(24, "hour"))),
						row,
					]);
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
		if (chartRef.current && historyWithGaps.length > 0) {
			chartRef.current.data.labels = historyWithGaps.map((r) => new Date(r.timestamp).getTime());
			chartRef.current.data.datasets[0].data = historyWithGaps.map((r) => r.temperature?.toFixed(2));
			chartRef.current.data.datasets[1].data = historyWithGaps.map((r) => r.humidity?.toFixed(2));
			chartRef.current.data.datasets[2].data = historyWithGaps.map((r) => r.pressure?.toFixed(2));
			chartRef.current.update();
		}
	}, [historyWithGaps]);

	return (
		<>
			<Head>
				<title>Cloudy | Weather station</title>
				<meta
					name="description"
					content="A weather station project based on the BME280 sensor with live updates"
				/>
				<meta name="keywords" content="weather, station, bme280, sensor, live" />
				<meta name="author" content="Piotr Kozak" />
				<link
					rel="icon"
					href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 20 16'><text x='0' y='14'>🌧️</text></svg>"
				/>
			</Head>

			<main className="m-auto grid h-full w-full grid-cols-1 grid-rows-[128px,_128px,_256px,_256px,_128px] gap-2 p-2 md:grid-cols-2 md:grid-rows-[128px,auto,auto,128px] lg:grid-cols-[0.9fr_1fr_1.1fr] lg:grid-rows-[128px,1fr,_128px] xl:w-4/5">
				<div
					className={`rounded bg-primary p-2 text-background dark:text-text ${
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
					<div
						className={`flex items-center gap-2 rounded bg-secondary p-2 shadow-inner ${
							current.timestamp === "" ? "animate-pulse" : ""
						}`}
					>
						{current.timestamp !== "" && (
							<>
								<DropletIcon className="h-6 w-6" />
								<div>
									<p className="text-right text-xs text-text/90">Air humidity</p>
									<span className="ml-2 text-2xl font-semibold">{current.humidity.toFixed(1)}</span> %
								</div>
								<div>
									<p className="text-right text-xs text-text/90">Dew point</p>
									<span className="ml-2 text-2xl font-semibold">
										{calculateDewPoint(current.temperature, current.humidity).toFixed(1)}
									</span>{" "}
									<sup className="relative -top-1 text-lg">°C</sup>
								</div>
							</>
						)}
					</div>
					<div
						className={`flex items-center gap-2 rounded bg-secondary p-2 text-2xl shadow-inner ${
							current.timestamp === "" ? "animate-pulse" : ""
						}`}
					>
						{current.timestamp !== "" && (
							<>
								<CloudIcon className="h-6 w-6" />
								<div className="w-fit">
									<p className="text-right text-xs text-text/90">Atmospheric pressure</p>
									<span className="ml-2 font-semibold">{current.pressure.toFixed(1)}</span> hPa
								</div>
							</>
						)}
					</div>
				</div>
				<div className="ml-6 hidden lg:block">
					<h1 className="text-3xl">Device status</h1>
					<div className="flex flex-col gap-2">
						Average interval between updates is{" "}
						{dayHistory.length > 0 &&
							(calcAvgInterval(dayHistory.map((r) => r.timestamp)) / 1000).toFixed(2)}{" "}
						seconds
						<div>
							<span className="font-semibold">
								{dayHistory.filter((r) => r.temperature !== null).length} {"("}
								{(dataPointPercent * 100).toFixed(2)}%{") "}
							</span>
							datapoints in the last 24 hours
						</div>
					</div>
				</div>

				<div className="col-span-1 row-span-1 p-4 md:col-span-2 md:row-span-1 lg:p-0 lg:pt-4 xl:min-h-[356px]">
					<div className="mb-2 flex items-center justify-between">
						<h3 className=" dark:text-text/80">Last 24h graph</h3>
						<Switch.Group>
							<div className="flex items-center">
								<Switch.Label className="mr-4 dark:text-text/80">Enable time gaps</Switch.Label>
								<Switch
									checked={gapsEnabled}
									onChange={setGapsEnabled}
									className={`${gapsEnabled ? "bg-primary" : "bg-secondary"}
         								relative inline-flex h-6 w-11 items-center rounded-full`}
								>
									<span
										className={`${
											gapsEnabled ? "translate-x-6" : "translate-x-1"
										} inline-block h-4 w-4 transform rounded-full bg-white transition `}
									/>
								</Switch>
							</div>
						</Switch.Group>
					</div>

					{dayHistory?.length > 0 ? (
						<Line
							aria-description="Last 24 hours graph"
							ref={chartRef}
							data={{
								labels: (gapsEnabled ? historyWithGaps : dayHistory).map((r) =>
									new Date(r.timestamp).getTime(),
								),
								datasets: [
									{
										data: (gapsEnabled ? historyWithGaps : dayHistory).map(
											(r) => r.temperature?.toFixed(2),
										),
										label: "Temperature",
										tension: 0.1,
										hidden: !scales.y,
									},
									{
										data: (gapsEnabled ? historyWithGaps : dayHistory).map(
											(r) => r.humidity?.toFixed(2),
										),
										label: "Humidity",
										yAxisID: "y1",
										tension: 0.1,
										hidden: !scales.y1,
									},
									{
										data: (gapsEnabled ? historyWithGaps : dayHistory).map(
											(r) => r.pressure?.toFixed(2),
										),
										label: "Pressure",
										yAxisID: "y2",
										tension: 0.1,
										hidden: !scales.y2,
									},
								],
							}}
							options={{
								responsive: true,
								animation: false,
								color: styles?.getPropertyValue("--color-text"),
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
										ticks: {
											color: styles?.getPropertyValue("--color-text"),
										},
										grid: {
											color: styles?.getPropertyValue("--color-text") + "20",
										},
									},
									y: {
										type: "linear",
										display: scales.y,
										position: "left",
										grid: {
											color: styles?.getPropertyValue("--color-text") + "20",
											drawOnChartArea: false,
										},
										ticks: {
											callback: (value) => value + "°C",
											color: styles?.getPropertyValue("--color-text"),
										},
									},
									y1: {
										type: "linear",
										position: "right",
										display: scales.y1,
										max: 100,
										min: 0,
										grid: {
											color: styles?.getPropertyValue("--color-text") + "20",
											drawOnChartArea: false,
										},
										ticks: {
											callback: (value) => value + "%",
											color: styles?.getPropertyValue("--color-text"),
										},
									},
									y2: {
										type: "linear",
										display: scales.y2,
										grid: {
											color: styles?.getPropertyValue("--color-text") + "20",
											drawOnChartArea: false,
										},
										ticks: {
											color: styles?.getPropertyValue("--color-text"),
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
									},
								},
							}}
						/>
					) : (
						<div className="h-52 w-full animate-pulse rounded bg-secondary/40 dark:bg-secondary/80 lg:h-96 xl:h-[356px]" />
					)}
				</div>
				<div className="col-span-1 row-span-1 m-0 max-w-none px-4 md:col-span-2 lg:col-span-1 lg:ml-6 lg:max-w-md lg:p-0 lg:pt-4 xl:max-w-lg">
					<h2 className="mb-2 dark:text-text/80">Uptime in the last 24 hours</h2>
					<Uptime timestamps={dayHistory.map((r) => r.timestamp)} />

					<Link href={`/summary/${dayjs().format("YYYY-MM")}`} className="pt-8 underline">
						View monthly summary
					</Link>
				</div>
				<div className="col-span-1">
					<h3 className="mb-2 dark:font-light dark:text-text/80">Current month records</h3>
					<MonthTemperatures currentTemp={current.temperature} />
				</div>
			</main>
		</>
	);
}

/**
 * Sometimes the data gets manually deleted from the database
 * This function visualizes the gaps made by the missing data\
 * By adding fake null data with predicted timestamps
 */
const visualizeIDGaps = (rows: Row[]) => {
	const gaps: GapRow[] = [];
	const avgInterval = calcAvgInterval(rows.map((r) => r.timestamp));

	for (let i = 0; i < rows.length; i++) {
		if (i === 0) {
			gaps.push(rows[i]);
			continue;
		}

		const diff = rows[i].id - rows[i - 1].id;
		if (diff > 1) {
			for (let j = 0; j < diff - 1; j++) {
				gaps.push({
					id: rows[i - 1].id + j + 1,
					temperature: undefined,
					pressure: undefined,
					humidity: undefined,
					timestamp: new Date(
						new Date(rows[i - 1].timestamp).getTime() + avgInterval * (j + 1),
					).toISOString(),
				});
			}
		}
		gaps.push(rows[i]);
	}
	return gaps;
};

/**
 * Vizualize gaps between timestamps by calculating the average interval
 * By adding fake null data with predicted timestamps using the interval
 */
const visualizeTimeGaps = (rows: GapRow[]) => {
	const gaps: GapRow[] = [];
	const avgInterval = calcAvgInterval(rows.map((r) => r.timestamp));

	for (let i = 0; i < rows.length; i++) {
		if (i === 0) {
			gaps.push(rows[i]);
			continue;
		}

		const diff = dayjs(rows[i].timestamp).diff(dayjs(rows[i - 1].timestamp), "millisecond");
		if (diff > avgInterval * 1.7) {
			const numGaps = Math.floor(diff / avgInterval);
			for (let j = 0; j < numGaps; j++) {
				gaps.push({
					// The ids won't be correct at this point, as for sure there will be duplicates
					// But at this stage they are not needed
					id: rows[i - 1].id + j + 1,
					temperature: undefined,
					pressure: undefined,
					humidity: undefined,
					timestamp: dayjs(rows[i - 1].timestamp)
						.add(avgInterval * (j + 1), "millisecond")
						.toISOString(),
				});
			}
		}
		gaps.push(rows[i]);
	}
	return gaps;
};

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

interface GapRow {
	id: number;
	temperature: number | undefined;
	pressure: number | undefined;
	humidity: number | undefined;
	timestamp: string;
}

export interface Row {
	id: number;
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
