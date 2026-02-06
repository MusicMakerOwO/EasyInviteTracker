export function Debounce<T>(func: Function, delay: number): T {
	let timeout: NodeJS.Timeout | undefined;
	return function (... args: any[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(... args), delay);
	} as unknown as T;
}