export type OperationCache = {
	get(key: string): Promise<unknown> | undefined;
	set(key: string, value: Promise<unknown>): void;
	delete(key: string): void;
	entries?: () => MapIterator<[string, Promise<unknown>]>;
};

export type OperationCacheFactory = () => OperationCache;

let cacheFactory: OperationCacheFactory = () =>
	new Map<string, Promise<unknown>>();

export function setOperationCacheFactory(factory: OperationCacheFactory) {
	cacheFactory = factory;
}

export function getOperationCache(): OperationCache {
	return cacheFactory();
}
