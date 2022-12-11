import { Weather } from "@prisma/client";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Chart as ChartComponent } from "react-chartjs-2";
import Head from "next/head";
import moment from "moment";

Chart.register(...registerables);

export default function Home() {
	const [recentData, setRecentData] = useState<Weather[]>([]);
	const [yearData, setData] = useState<Weather[]>([]);
	const supabase = useSupabaseClient();

	useEffect(() => {
		fetch("/api/yearData")
			.then((res) => res.json())
			.then((data) => setData(data));

		fetch("/api/recentData")
			.then((res) => res.json())
			.then((data) => setRecentData(data));
	}, []);

	return (
		<>
			<Head>
				<title>Cloudy</title>
			</Head>
			<header className="py-2 px-4">
				<h1 className="text-4xl font-bold">Cloudy</h1>
				<h2>Graph weather data however you like!</h2>
			</header>
			<main className="w-4/5 my-4 mx-auto rounded-md border p-4 ">
				<h3>Data for last {}</h3>
				<ChartComponent
					type="line"
					data={{
						labels: recentData.map((data) =>
							moment(data.timestamp).format("HH:mm:ss ")
						),
						datasets: [
							{
								label: "Temperature ()",
								data: recentData.map((d) => d.temp),
								order: 1,
								stack: "temp"
							},
							{
								label: "Humidity (%)",
								data: recentData.map((d) => d.humidity),
								order: 2,
								stack: "linear",
								type: "line",
								yAxisID: "y1"
							},
							{
								type: "line",
								label: "Pressure (hPa)",
								data: recentData.map((d) => d.pressure),
								order: 3,
								stack: "pressure",
								yAxisID: "y1"
							}
						]
					}}
					options={{
						responsive: true,
						scales: {
							y: {
								type: "linear",
								display: true,
								position: "left",
								max: 50,
								min: -10,
								grid: {
									color: "#b4b4b4",
									z: 0

								}
							},
							y1: {
								type: "linear",
								display: true,
								position: "right",
								grid: {
									drawOnChartArea: false
								}
							},
							y2: {
								type: "linear",
								display: true,
								position: "right",
								grid: {
									drawOnChartArea: false
								}
							}
						}
					}}
				/>
			</main>

			<section className="w-4/5 mx-auto my-4 rounded-md border p-4">
				<h3>Average data for each month</h3>
				<ChartComponent
					type="bar"
					data={{
						labels: months,
						datasets: [
							{
								label: "Temperature ()",
								data: yearData.map((d) => d.temp),
								order: 1,
								stack: "temp"
							},
							{
								label: "Humidity (%)",
								data: yearData.map((d) => d.humidity),
								order: 2,
								stack: "linear",
								type: "line",
								yAxisID: "y1"
							},
							{
								type: "line",
								label: "Pressure (hPa)",
								data: yearData.map((d) => d.pressure),
								order: 3,
								stack: "pressure",
								yAxisID: "y1"
							}
						]
					}}
					options={{
						responsive: true,
						skipNull: true,
						scales: {
							y: {
								type: "linear",
								display: true,
								position: "left",
								max: 50,
								min: -10,
								grid: {
									color: "#b4b4b4",
									z: 0

								}
							},
							y1: {
								type: "linear",
								display: true,
								position: "right",
								grid: {
									drawOnChartArea: false
								}
							},
							y2: {
								type: "linear",
								display: true,
								position: "right",
								grid: {
									drawOnChartArea: false
								}
							}
						}
					}}
				/>
			</section>
			<div className="w-4/5 mx-auto rounded-md border py-2 my-2 px-4 flex items-center gap-2">
				<div className={`rounded-full w-4 h-4 inline-block ${getLED(new Date(recentData?.[0]?.timestamp))}`}/>
				Weather station is {recentData.length && isOnline(new Date(recentData[0].timestamp))} - last update was{" "}
				{recentData.length && moment(recentData[0].timestamp).fromNow()}
			</div>
		</>
	);
}

const isOnline = (date: Date) => {
	const minuteAgo = Date.now() - 1000 * 60;
	if (date.getTime() > minuteAgo) {
		return "online";
	} else {
		return "offline";
	}
};

const getLED = (date: Date | undefined) => {
	if(!date) return "bg-gray-500";

	const minuteAgo = Date.now() - 1000 * 60;
	if (date.getTime() > minuteAgo) {
		return "bg-green-400";
	} else {
		return "bg-red-400";
	}
}

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
