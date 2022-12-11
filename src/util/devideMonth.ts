import { Weather } from "@prisma/client";

const devideByMonth = (data: Weather[]) => {
	const monthData = data.reduce((acc, cur) => {
		const month = cur.timestamp.getMonth();

		if (!acc[month]) {
			acc[month] = [];
		}

		acc[month].push(cur);
		return acc;
	}, {} as Record<number, Weather[]>);

	return monthData;
};
