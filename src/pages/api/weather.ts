import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../util/prisma";
import { Weather } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") {
		res.status(405).end();
		return;
	}

	if (req.query.key !== process.env.STATION_KEY) {
		res.status(401).end();
	}

	const { temp, humidity, pressure } = req.body as Weather;

	const weather = await prisma.weather.create({
		data: {
			temp: parseFloat(temp.toFixed(2)),
			humidity: parseFloat(humidity.toFixed(2)),
			pressure: parseFloat(pressure.toFixed(2)),
		},
	});

	res.status(200).json(weather);
};

export default handler;
