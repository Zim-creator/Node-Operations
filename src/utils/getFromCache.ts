import { type OperationCacheMap } from "#src/store";

export function getFromCache<T>(
	cache: OperationCacheMap,
	key: string,
): Promise<T> | undefined {
	return cache.get(key) as Promise<T> | undefined;
}
