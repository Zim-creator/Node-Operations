import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type Fn,
	type OperationFunction,
	type OperationHandler,
} from '#src/types';

type FirstInput<T> = T extends readonly Fn[]
	? T[0] extends Fn<infer Args, infer _Result>
		? Args[0]
		: never
	: never;

type LastResult<T> = T extends readonly [...infer _First, infer LastFunc]
	? LastFunc extends Fn<infer _Input, infer Result>
		? Awaited<Result>
		: never
	: never;

type CompareFunc<
	First extends Fn,
	Second extends unknown | undefined = undefined | never,
> = Second extends undefined | never
	? First
	: First extends Fn<infer FirstInput, infer Result>
		? Second extends Fn<infer Input>
			? // biome-ignore lint/suspicious/noConfusingVoidType: expected void
				Input[0] extends undefined | never | void
				? First
				: Awaited<Result> extends Input[0]
					? First
					: // biome-ignore lint/suspicious/noConfusingVoidType: expected void
						Awaited<Result> extends undefined | void
						? undefined extends Input[0]
							? First
							: Fn<FirstInput, Input[0]>
						: Fn<FirstInput, Input[0]>
			: First
		: never;

type PossibleCallback<In extends BaseIO = BaseIO, Out extends BaseIO = BaseIO> =
	| OperationHandler<In, Out>
	| OperationFunction<In, Out>;

type ValidateFunctions<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer In, infer Out>
		? In & Out extends BaseIO
			? [CompareFunc<First, Rest[0]>, ...ValidateFunctions<Rest>]
			: [PossibleCallback, ...ValidateFunctions<Rest>]
		: [PossibleCallback, ...ValidateFunctions<Rest>]
	: PossibleCallback[];

export function Pipe<
	const TSteps extends PossibleCallback[],
	TInput extends FirstInput<TSteps>,
	TResult extends LastResult<TSteps>,
>(
	steps: TSteps & ValidateFunctions<TSteps>,
	config?: OperationConfig<TInput>,
): OperationFunction<TInput, TResult> {
	if (!steps.length) {
		throw new Error('Error: empty array');
	}

	return Operation<TInput, TResult>(async (initialInput, initialCtx) => {
		let result: BaseIO = initialInput;

		for (const step of steps) {
			result = await step(result, initialCtx);
		}

		return result as TResult;
	}, config);
}
