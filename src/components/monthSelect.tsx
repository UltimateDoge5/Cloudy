"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const MonthSelect = ({ months, currentMonth }: { months: string[]; currentMonth: string }) => {
	const router = useRouter();

	return (
		<select
			className="block rounded-lg px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
			onChange={(e) => void router.push(`/summary/${e.target.value}`)}
			id="monthSelect"
		>
			{months.map((month) => (
				<option
					key={month}
					value={dayjs(month).format("YYYY-MM")}
					selected={currentMonth === dayjs(month).format("YYYY-MM")}
				>
					{dayjs(month).format("MMMM YYYY")}
				</option>
			))}
		</select>
	);
};

export default MonthSelect;
