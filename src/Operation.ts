import { getReactCache } from "#src/store";
import {
	type BaseIO,
	type OperationContext,
	type OperationFunction,
	type OperationHandler,
	type OperationMeta,
} from "#src/types.d";
import { getFromCache } from "#src/utils/getFromCache";
import { isOperation } from "#src/utils/isOperation";

type OperationConfigWithCache<TInput> = {
	cache: true;
	key: string | ((input: TInput) => string);
};

type OperationConfigWithoutCache = {
	cache?: false;
	key?: string | undefined;
};

type OperationConfigCache<TInput> =
	| OperationConfigWithCache<TInput>
	| OperationConfigWithoutCache;

export type OperationConfig<TInput> = {} & OperationConfigCache<TInput>;

export function Operation<
	TInput extends BaseIO = void,
	TResult extends BaseIO = void,
>(
	handler: OperationHandler<TInput, TResult>,
	config?: OperationConfig<TInput>,
): OperationFunction<TInput, TResult> {
	if (isOperation<TInput, TResult>(handler)) {
		return handler;
	}

	const { cache: shouldCache, key } = config || {};
	const getKey = typeof key === "function" ? key : () => key as string;

	const baseExecutable = async (
		initialInput: TInput,
		initialCtx?: Partial<OperationContext>,
	): Promise<TResult> => {
		const input = initialInput;

		const ctx: OperationContext = {
			cache: initialCtx?.cache ?? getReactCache(),
		};

		const cacheKey = shouldCache && key ? getKey(input) : undefined;

		if (!cacheKey) {
			return await handler(input, ctx);
		}

		const cachedResult = getFromCache<TResult>(ctx.cache, cacheKey);

		if (cachedResult) {
			console.log("CHACHED RESULT: ", ctx.cache.entries());
			return cachedResult;
		}

		const executionPromise = Promise.resolve(handler(input, ctx));
		ctx.cache.set(cacheKey, executionPromise);

		return executionPromise;
	};

	const operationMeta: OperationMeta = {
		__isOperation: true as const,
	};

	return Object.assign(baseExecutable, operationMeta);
}
