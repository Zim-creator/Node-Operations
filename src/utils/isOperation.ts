import { type BaseIO, type OperationFunction } from "#src/types";

export function isOperation<TInput extends BaseIO, TResult extends BaseIO>(
	fn: unknown | OperationFunction<TInput, TResult>,
): fn is OperationFunction<TInput, TResult> {
	return (
		typeof fn === "function" &&
		"__isOperation" in fn &&
		fn.__isOperation === true
	);
}
