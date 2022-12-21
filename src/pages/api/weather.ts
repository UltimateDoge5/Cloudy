import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../util/prisma";
import { Weather } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") {
		res.status(405).end();
		return;
	}

	const data = JSON.parse(req.body) as Weather;

	if (req.query.key !== process.env.STATION_KEY) {
		res.status(401).end();
	}

	const weather = await prisma.weather.create({
		data: {
			temp: data.temp,
			humidity: data.humidity,
			pressure: data.pressure,
			timestamp: new Date(),
		},
	});

	res.status(200).json(weather);
};

export default handler;
