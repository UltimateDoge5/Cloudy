"use client";

import {
	CategoryScale,
	Chart,
	Colors,
	Legend,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	TimeSeriesScale,
	Tooltip,
} from "chart.js";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm.js";
import { Line } from "react-chartjs-2";
import { Database } from "../../../schema";

type MinMaxChartProps = Database["public"]["Functions"]["get_month_summary"]["Returns"];

Chart.register(
	LineController,
	LineElement,
	LinearScale,
	CategoryScale,
	PointElement,
	TimeSeriesScale,
	// Decimation,
	Tooltip,
	Legend,
	Colors,
);

const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : undefined;

const MinMaxChart = ({ data }: { data: MinMaxChartProps }) => (
	<Line
		data={{
			labels: data.map((r) => new Date(r.day).getTime()),
			datasets: [
				{
					data: data.map((r) => r.min_temp.toFixed(2)),
					label: "Min temperature",
					tension: 0.4,
				},
				{
					data: data.map((r) => r.max_temp.toFixed(2)),
					label: "Max temperature",
					tension: 0.4,
				},
			],
		}}
		options={{
			responsive: true,
			color: styles?.getPropertyValue("--color-text"),
			scales: {
				x: {
					type: "timeseries",
					time: {
						unit: "day",
					},
					ticks: {
						color: styles?.getPropertyValue("--color-text"),
					},
					grid: {
						color: styles?.getPropertyValue("--color-text") + "20",
					},
				},
				y: {
					ticks: {
						callback: (value) => value + "°C",
						color: styles?.getPropertyValue("--color-text"),
					},
					grid: {
						color: styles?.getPropertyValue("--color-text") + "20",
					},
				},
			},
		}}
	/>
);

export default MinMaxChart;
