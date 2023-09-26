"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const MonthSelect = ({ months, currentMonth }: { months: string[]; currentMonth: string }) => {
	const router = useRouter();

	return (
		<select
			className="block border-b bg-background px-2 py-1 text-2xl focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
			onChange={(e) => void router.push(`/summary/${e.target.value}`)}
			defaultValue={currentMonth}
			id="monthSelect"
		>
			{months.map((date) => (
				<option key={date} value={dayjs(date).format("YYYY-MM")} className="bg-background text-base">
					{dayjs(date).format("MMMM YYYY")}
				</option>
			))}
		</select>
	);
};

export default MonthSelect;
