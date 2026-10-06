import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type Fn,
	type OperationFunction,
	type PossibleCallback,
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

type ValidateFunctions<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer _In, infer _Out>
		? Rest[0] extends PossibleCallback<infer _In, infer _Out>
			? [CompareFunc<First, Rest[0]>, ...ValidateFunctions<Rest>]
			: [First]
		: PossibleCallback[]
	: [PossibleCallback, ...PossibleCallback[]];

export function Pipe<const TSteps>(
	steps: TSteps & ValidateFunctions<TSteps>,
	config?: OperationConfig<FirstInput<TSteps>>,
): OperationFunction<FirstInput<TSteps>, LastResult<TSteps>> {
	if (!steps.length) {
		throw new Error('Error: empty array');
	}

	return Operation<FirstInput<TSteps>, LastResult<TSteps>>(
		async (initialInput, initialCtx) => {
			let result: BaseIO = initialInput;

			for (const step of steps) {
				result = await step(result, initialCtx);
			}

			return result as LastResult<TSteps>;
		},
		config,
	);
}
