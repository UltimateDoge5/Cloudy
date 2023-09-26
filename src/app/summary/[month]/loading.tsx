const SummaryLoading = () => {
	return (
		<>
			<h1 className="m-auto flex w-fit items-center gap-3 pb-4 pt-1 text-4xl">
				Summary of <div className="h-10 w-52 animate-pulse rounded-xl bg-secondary/80" />
			</h1>
			<div
				style={{
					height: "calc(100vh*0.75)",
				}}
				className="dark:bg-secondary/8 m-auto w-4/5 animate-pulse rounded-lg bg-secondary/80"
			/>
		</>
	);
};

export default SummaryLoading;
