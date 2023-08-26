import { useMemo } from "react";
import { Bar } from "react-chartjs-2";

const relativeTime = new Intl.RelativeTimeFormat("en-Us", { style: "narrow" });

const minsToHours = (mins: number) => {
	const hours = Math.floor(mins / 60);
	const minutes = mins % 60;
	if (hours === 0) return relativeTime.format(-minutes, "minute");
	if (minutes === 0) return relativeTime.format(-hours, "hour");
	return relativeTime.format(-hours + -minutes / 60, "hours");
};

const labels = Array.from({ length: 48 }, (_, i) => minsToHours((i + 1) * 30)).reverse();
labels[47] = "Now";

export const Uptime = ({ timestamps }: { timestamps: string[] }) => {
	const uptime = useMemo(() => calculateDeviceUptime(timestamps), [timestamps]);

	if (timestamps.length === 0) return <div className="mt-2 h-52 w-full animate-pulse rounded bg-secondary/40" />;

	return (
		<Bar
			data={{
				labels,
				datasets: [
					{
						data: uptime,
						label: "Received updates",
						backgroundColor: "#2172ca",
					},
				],
			}}
			options={{
				color:"#010905",
				scales: {
					y: {
						position: "right",
						beginAtZero: true,
						max: 90,
					},
				},
			}}
		/>
	);
};
/**
 * Calculate the devices uptime based on the provided timestamps for the last 24 hours
 * Calculate the number of records per 30 minutes
 * If no updates are received for 30 minutes, return zero
 * If updates are received, increment the counter
 * @param timestamps
 */
const calculateDeviceUptime = (timestamps: string[]): number[] => {
	const uptime = new Array(48).fill(0) as number[];
	const now = new Date().getTime();

	// Check in which 30-minute interval the timestamp is
	// If the timestamp is older than 24 hours, ignore it
	for (const timestamp of timestamps) {
		const timestampDate = new Date(timestamp).getTime();
		if (timestampDate < now - 24 * 60 * 60 * 1000) continue;
		const diff = Math.floor((now - timestampDate) / 1000 / 60);
		const index = Math.floor(diff / 30);
		if (index >= 48) continue;
		uptime[index]++;
	}

	return uptime.map((v) => Math.min(v, 90)).reverse();
};
