import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html>
			<Head />
			{/* <body className="min-h-screen bg-gradient-to-br from-blue-700 via-teal-600 to-green-400 text-white"> */}
			<body className="min-h-screen bg-white text-black dark:bg-slate-800 dark:text-white">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}