import { Operation, type OperationConfig } from "#src/Operation";
import {
	type BaseIO,
	type OperationFunction,
	type OperationHandler,
} from "#src/types.d";

type PossibleCallback<
	In extends BaseIO = BaseIO,
	Out extends BaseIO = BaseIO,
> = OperationHandler<In, Out> | OperationFunction<In, Out>;

type ValidateFunctions<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer In, infer Out>
		? In & Out extends BaseIO
			? [First, ...ValidateFunctions<Rest>]
			: [PossibleCallback, ...ValidateFunctions<Rest>]
		: [PossibleCallback, ...ValidateFunctions<Rest>]
	: PossibleCallback[];

type GetIO<TFuncs, TInput extends boolean> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer In, infer Out>
		? (TInput extends true ? In : Out) extends infer IO
			? IO extends BaseIO
				? IO extends undefined | void | null
					? GetIO<Rest, TInput>
					: IO & GetIO<Rest, TInput>
				: 4
			: 3
		: 2
	: never;

export async function Parallel<const TSteps, TInput = GetIO<TSteps, true>>(
	steps: TSteps & ValidateFunctions<TSteps>,
	config?: OperationConfig<TInput>,
) {
	return Operation((input) => {});
}

const test = Parallel([(i: { a: string }) => {}, () => {}]);
const test2 = Parallel([]);
