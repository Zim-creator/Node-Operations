import { Operation } from '#src/Operation';
import {
	type BaseIO,
	type OperationFunction,
	type OperationHandler,
} from '#src/types';

type GeneratedResult<
	TInput extends BaseIO,
	TResult extends BaseIO,
	// biome-ignore lint/suspicious/noConfusingVoidType: expected
> = Exclude<TResult, null | undefined | void> | TInput;

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
