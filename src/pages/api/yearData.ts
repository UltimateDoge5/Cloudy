import { prisma } from "../../util/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") return res.status(405).end();

	let { year } = req.query;

	if (!year) year = new Date().getFullYear().toString();

	let weatherData = await prisma.weather.findMany({
		where: {
			timestamp: {
				gte: new Date(`${year}-01-01`),
				lte: new Date(`${year}-12-31`),
			},
		},
	});

	// Divide the data into months
	const yearData = [];
	for (let i = 0; i < 12; i++) {
		yearData.push(weatherData.filter((data) => data.timestamp.getMonth() === i));
	}

	// Calculate the average for each month
	const avgMonthData = yearData.map((month) => {
		const avg = month.reduce(
			(acc, curr) => {
				acc.temp += curr.temp;
				acc.humidity += curr.humidity;
				acc.pressure += curr.pressure;
				return acc;
			},
			{ temp: 0, humidity: 0, pressure: 0 }
		);

		return {
			temp: avg.temp / month.length,
			humidity: avg.humidity / month.length,
			pressure: avg.pressure / month.length,
		};
	});

	res.status(200).json(avgMonthData);
}
