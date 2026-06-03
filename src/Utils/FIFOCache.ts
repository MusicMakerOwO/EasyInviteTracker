export class FIFOCache<K, V> extends Map<K, V> {
	readonly maxEntries: number;

	constructor(maxEntries: number, entries?: Iterable<readonly [K, V]>) {
		if (!Number.isInteger(maxEntries) || maxEntries < 1) {
			throw new Error('maxEntries must be an integer greater than 0');
		}

		super();
		this.maxEntries = maxEntries;

		if (entries) {
			for (const [key, value] of entries) {
				this.set(key, value);
			}
		}
	}

	override set(key: K, value: V): this {
		const hasKey = this.has(key);
		super.set(key, value);

		if (!hasKey && this.size > this.maxEntries) {
			const oldestKey = this.keys().next().value as K | undefined;
			if (oldestKey !== undefined) this.delete(oldestKey);
		}

		return this;
	}
}