import { ComponentProps } from "react";

export const DropletIcon = (props: ComponentProps<"svg">) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="transparent"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		{...props}
	>
		<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
	</svg>
);

export const CloudIcon = (props: ComponentProps<"svg">) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		{...props}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
		/>
	</svg>
);

export const ArrowDownIconSolid = (props: ComponentProps<"svg">) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
		<path
			fillRule="evenodd"
			d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
			clipRule="evenodd"
		/>
	</svg>
);

export const ArrowUpIconSolid = (props: ComponentProps<"svg">) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
		<path
			fillRule="evenodd"
			d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
			clipRule="evenodd"
		/>
	</svg>
);
