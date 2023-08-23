import { Chart, registerables } from "chart.js";
import Head from "next/head";

Chart.register(...registerables);

export default function Home() {
	return (
		<>
			<Head>
				<title>Cloudy</title>
			</Head>
		</>
	);
}

