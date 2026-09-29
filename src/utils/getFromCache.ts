import { type OperationCache } from '#src/store';

export function getFromCache<T>(
	cache: OperationCache,
	key: string,
): Promise<T> | undefined {
	return cache.get(key) as Promise<T> | undefined;
}
