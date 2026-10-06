import { Operation } from '#src/Operation';
import {
	type BaseIO,
	type OperationFunction,
	type OperationHandler,
} from '#src/types';

type GeneratedResult<
	TInput extends BaseIO,
	TResult extends BaseIO,
	TExcludes = null | undefined | never,
> =
	Exclude<TResult, TExcludes> extends never
		? TInput
		: TResult extends TExcludes
			? Exclude<TResult, TExcludes> | TInput
			: TResult;

export function Optional<TInput extends BaseIO, TResult extends BaseIO>(
	handler:
		| OperationHandler<TInput, TResult>
		| OperationFunction<TInput, TResult>,
): OperationFunction<TInput, GeneratedResult<TInput, TResult>> {
	return Operation<TInput, GeneratedResult<TInput, TResult>>(
		async (input, ctx) => {
			try {
				const result = await handler(input, ctx);

				return (result ?? input) as GeneratedResult<TInput, TResult>;
			} catch {
				return input as GeneratedResult<TInput, TResult>;
			}
		},
	);
}
