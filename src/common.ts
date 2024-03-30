import dayjs from "dayjs";

/**
 * Sometimes the data gets manually deleted from the database
 * This function visualizes the gaps made by the missing data
 * By adding fake null data with predicted timestamps
 */
export function visualizeIDGaps(rows: Row[]) {
	const gaps: GapRow[] = [];
	const avgInterval = calcAvgInterval(rows.map((r) => r.timestamp));

	for (let i = 0; i < rows.length; i++) {
		if (i === 0) {
			gaps.push(rows[i]);
			continue;
		}

		const diff = rows[i].id - rows[i - 1].id;
		if (diff > 1) {
			for (let j = 0; j < diff - 1; j++) {
				gaps.push({
					id: rows[i - 1].id + j + 1,
					temperature: undefined,
					pressure: undefined,
					humidity: undefined,
					timestamp: new Date(
						new Date(rows[i - 1].timestamp).getTime() + avgInterval * (j + 1)
					).toISOString()
				});
			}
		}
		gaps.push(rows[i]);
	}
	return gaps;
}

/**
 * Vizualize gaps between timestamps by calculating the average interval
 * By adding fake null data with predicted timestamps using the interval
 */
export function visualizeTimeGaps(rows: GapRow[]) {
	const gaps: GapRow[] = [];
	const avgInterval = calcAvgInterval(rows.map((r) => r.timestamp));

	for (let i = 0; i < rows.length; i++) {
		if (i === 0) {
			gaps.push(rows[i]);
			continue;
		}

		const diff = dayjs(rows[i].timestamp).diff(dayjs(rows[i - 1].timestamp), "millisecond");
		if (diff > avgInterval * 1.7) {
			const numGaps = Math.floor(diff / avgInterval);
			for (let j = 0; j < numGaps; j++) {
				gaps.push({
					// The ids won't be correct at this point, as for sure there will be duplicates
					// But at this stage they are not needed
					id: rows[i - 1].id + j + 1,
					temperature: undefined,
					pressure: undefined,
					humidity: undefined,
					timestamp: dayjs(rows[i - 1].timestamp)
						.add(avgInterval * (j + 1), "millisecond")
						.toISOString()
				});
			}
		}
		gaps.push(rows[i]);
	}
	return gaps;
}

export function calcAvgInterval(timestamps: string[]) {
	let sum = 0;
	for (let i = 0; i < timestamps.length - 1; i++) {
		const diff = new Date(timestamps[i + 1]).getTime() - new Date(timestamps[i]).getTime();
		sum += diff;
	}
	return sum / timestamps.length;
}

export interface Row {
	id: number;
	temperature: number;
	pressure: number;
	humidity: number;
	timestamp: string;
}

export interface GapRow {
	id: number;
	temperature: number | undefined;
	pressure: number | undefined;
	humidity: number | undefined;
	timestamp: string;
}

export interface Scales {
	y: boolean;
	y1: boolean;
	y2: boolean;
}