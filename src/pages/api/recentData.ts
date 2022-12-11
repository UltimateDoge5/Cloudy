import {  NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../util/prisma";

const handler = async (req:NextApiRequest, res:NextApiResponse) => {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    const weather = await prisma.weather.findMany({
        take: 10
    });

    res.status(200).json(weather);
}

export default handler;