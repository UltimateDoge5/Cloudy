import { SupabaseClient, createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { Metadata } from "next/types";
import { Database } from "../../../schema";
import MinMaxChart from "./chart";

export const generateMetadata = ({ params }: { params: { month: string } }): Metadata => {
	const [year, month] = params.month.split("-").map((value) => parseInt(value));
	const dateName = dayjs(month).set("year", year).set("month", month).format("MMMM YYYY");

	return {
		title: `${dateName} | Cloudy`,
		description: `Summary of highest and lowest temperatures in${dateName}.`,
	};
};

export default async function Page({ params }: { params: { month: string } }) {
	const [year, month] = params.month.split("-");

	if (!year || !month) {
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

	if (error) {
		console.error(error);
		return <h1>Error</h1>;
	}

	return (
		<>
			<h1>Summary of: {params.month}</h1>
			<div className="m-auto w-4/5">
				<MinMaxChart data={data.sort((a, b) => (dayjs(a.day).isBefore(dayjs(b.day)) ? -1 : 1))} />
			</div>
		</>
	);
}
