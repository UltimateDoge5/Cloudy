import { AppProps } from "next/dist/shared/lib/router/router";
import "../base.css";

export default function App({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}
