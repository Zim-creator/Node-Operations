import { type OperationCacheMap } from '#src/store';

// biome-ignore lint/suspicious/noExplicitAny: expected any
export type Fn<TArgs extends any[] = any[], TResult = any> = (
	...args: TArgs
) => TResult;

export type OperationMeta = {
	readonly __isOperation: true;
};

type Primitive = string | number | boolean | null | Date;

export type BaseIO =
	| {
			[key: string]: Primitive | BaseIO | (BaseIO | Primitive)[];
	  }
	| undefined
	// biome-ignore lint/suspicious/noConfusingVoidType: expected void
	| void
	| null;

export type OperationContext = {
	cache: OperationCacheMap;
};

export type OperationHandler<
	TInput extends BaseIO,
	TResult extends BaseIO,
	TCtx extends Partial<OperationContext> = Partial<OperationContext>,
> = (input: TInput, ctx: TCtx) => TResult | Promise<TResult>;

export type OperationFunction<
	TInput extends BaseIO,
	TResult extends BaseIO,
	TCtx extends Partial<OperationContext> = Partial<OperationContext>,
> = OperationMeta & ((input: TInput, ctx?: TCtx) => Promise<TResult>);
