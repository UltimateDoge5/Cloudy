import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../util/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "GET") {
		res.status(405).end();
		return;
	}

	const page = req.query.p !== undefined ? parseInt(req.query.p as string) : 0;

	const weather = await prisma.weather.findMany({
		orderBy: {
			timestamp: "desc",
		},
		take: 10,
		skip: page * 10,
	});

	res.status(200).json(weather);
};

export default handler;
