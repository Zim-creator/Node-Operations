// import { cache } from "react";

export type OperationCacheMap = Map<string, Promise<unknown>>;

// export const getReactCache = cache(() => new Map<string, Promise<unknown>>());
export const getReactCache = () => new Map<string, Promise<unknown>>();
