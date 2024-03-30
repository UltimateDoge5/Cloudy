import { createClient } from "@supabase/supabase-js";
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
import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { Database } from "../../schema";
import { Row, Scales, visualizeIDGaps, visualizeTimeGaps } from "../common";

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

const supabase = createClient<Database>(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const today = new Date().toISOString().slice(0, 10);

export default function ChartPage() {
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
	const [loading, setLoading] = useState(true);
	const [weather, setWeather] = useState<Row[]>([]);
	const [date, setDate] = useState(getDateFromQuery());

	useEffect(() => {
		if (date === "") return;
		setLoading(true);
		void supabase
			.from("weather")
			.select("id, temperature, pressure, humidity, timestamp")
			.order("id", { ascending: true })
			.gt("timestamp", dayjs(date).hour(0).minute(0).second(0).toISOString())
			.lt("timestamp", dayjs(date).hour(23).minute(59).second(59).toISOString())
			.then(({ data, error }) => {
				if (error) console.error(error);
				setWeather(data ?? []);
				setLoading(false);
			});
	}, [date]);

	const chartRef = useRef<ChartJSOrUndefined<"line", (string | undefined)[], number>>(undefined);
	const dataWithGaps = useMemo(() => visualizeTimeGaps(visualizeIDGaps(weather)), [weather]);
	const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : undefined;

	return (
		<>
			<Head>
				<title>Custom chart | Cloudy</title>
			</Head>
			<Link href="/" className="absolute left-4 top-2 hidden text-3xl lg:block">
				🌧️ Cloudy
			</Link>
			<h1 className="m-auto flex w-fit items-center gap-3 pb-4 text-2xl md:text-4xl">
				<label htmlFor="dateInput">Chart for</label>
				<input
					id="dateInput"
					type="date"
					min="2023-08-22"
					max={dayjs().add(1, "hour").toISOString().slice(0, 10)}
					value={date}
					onChange={(e) => {
						const newDate = e.target.value || today;

						const url = new URL(window.location.href);
						url.searchParams.set("date", newDate);
						window.history.pushState({}, "", url.toString()); // Set the query parameter

						setDate(newDate);
					}}
					className="block border-b bg-background px-2 py-1 text-2xl focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
				/>
			</h1>
			<div className="m-auto w-full lg:w-4/5">
				{dataWithGaps.length !== 0 && (
					<Line
						aria-description="Graph of all the weather data in the selected "
						ref={chartRef}
						data={{
							labels: dataWithGaps.map((r) => new Date(r.timestamp).getTime()),
							datasets: [
								{
									data: dataWithGaps.map((r) => r.temperature?.toFixed(2)),
									label: "Temperature",
									tension: 0.1,
									hidden: !scales.y,
								},
								{
									data: dataWithGaps.map((r) => r.humidity?.toFixed(2)),
									label: "Humidity",
									yAxisID: "y1",
									tension: 0.1,
									hidden: !scales.y1,
								},
								{
									data: dataWithGaps.map((r) => r.pressure?.toFixed(2)),
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
				)}

				{dataWithGaps.length === 0 && !loading && (
					<div className="m-auto mt-6 h-auto w-[98%] rounded bg-red-400 p-4 text-red-800 md:h-1/4 md:w-1/4 dark:bg-red-300">
						<h1 className="text-xl md:text-2xl">No data</h1>
						<h2>Sorry but there was no data for the selected date </h2>
					</div>
				)}
			</div>

			{dataWithGaps.length === 0 && loading && (
				<div
					style={{
						height: "calc(100vh*0.75)",
					}}
					className="m-auto w-4/5 animate-pulse rounded-lg bg-secondary/80"
				/>
			)}
		</>
	);
}

function getDateFromQuery() {
	if (typeof window === "undefined") return "";
	const url = new URL(window.location.href);
	const dateParam = url.searchParams.get("date");

	if (dateParam) return dateParam;
	else if (dateParam === "") {
		url.searchParams.set("date", today);
		window.history.replaceState({}, "", url.toString());
		return today;
	}
}
