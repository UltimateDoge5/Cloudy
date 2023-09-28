export const runtime = "edge";

import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { Metadata } from "next/types";
import MinMaxChart from "./chart";
import { Database } from "../../../../schema";
import MonthSelect from "components/monthSelect";

export const generateMetadata = ({ params }: { params: { month: string } }): Metadata => {
	const [year, month] = params.month.split("-").map((value) => parseInt(value));
	let dateName = dayjs()
		.set("year", year)
		.set("month", month - 1)
		.format("MMMM YYYY");

	if (!year || !month || month > 12 || month < 1) {
		dateName = dayjs().format("MMMM YYYY");
	}

	return {
		title: `${dateName} | Cloudy`,
		description: `Summary of highest and lowest temperatures in ${dateName}.`,
		icons: [
			{
				rel: "icon",
				url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 20 16'><text x='0' y='14'>🌧️</text></svg>",
			},
		],
	};
};

export default async function Page({ params }: { params: { month: string } }) {
	const [year, month] = params.month.split("-");

	if (
		!year ||
		!month ||
		isNaN(parseInt(year)) ||
		isNaN(parseInt(month)) ||
		parseInt(month) > 12 ||
		parseInt(month) < 1
	) {
		const month = dayjs().format("YYYY-MM");
		redirect(`/month/${month}`);
	}

	const supabase = createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);

	const { data, error } = await supabase.rpc("get_month_summary", {
		input_timestamp: `${year}-${month}-01T00:00:00.000Z`,
	});

	const { data: months } = await supabase.rpc("get_months");

	if (error) {
		console.error(error);
		return (
			<div className="m-auto mt-6 h-1/4 w-1/4 rounded bg-red-400 p-4 text-red-800 dark:bg-red-300">
				<h1 className="text-2xl">Database error</h1>
				<h2>Sorry but there was an error while fetching the data 😥</h2>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="m-auto h-1/4 w-1/4 rounded bg-primary/80 p-4">
				<h1 className="text-2xl">No data</h1>
				<h2>Sorry but there is no data for this month 😥</h2>
			</div>
		);
	}

	return (
		<>
			<h1 className="m-auto flex w-fit items-center gap-3 pb-4 text-4xl">
				<label htmlFor="monthSelect">Summary of</label>
				<MonthSelect
					months={months!.map((month) => month.month)}
					currentMonth={dayjs()
						.set("year", parseInt(year))
						.set("month", parseInt(month) - 1)
						.format("YYYY-MM")}
				/>
			</h1>
			<div className="m-auto w-4/5">
				<MinMaxChart data={data.sort((a, b) => (dayjs(a.day).isBefore(dayjs(b.day)) ? -1 : 1))} />
			</div>
		</>
	);
}
