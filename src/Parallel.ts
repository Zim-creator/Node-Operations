import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type BaseIOObject,
	type OperationFunction,
	type PossibleCallback,
} from '#src/types';
import { Optional } from './Optional.js';

type ValidateFunctions<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer In, infer Out>
		? [In, Out] extends BaseIO[]
			? Rest[0] extends PossibleCallback<infer _In, infer _Out>
				? [First, ...ValidateFunctions<Rest>]
				: [First]
			: PossibleCallback[]
		: [PossibleCallback, ...PossibleCallback[]]
	: [PossibleCallback, ...PossibleCallback[]];

type CombineInputs2<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? First extends PossibleCallback<infer In, infer _Out>
		? In extends BaseIO
			? In extends BaseIOObject
				? Rest[0] extends PossibleCallback<infer _In, infer _Out>
					? In & CombineInputs<Rest>
					: In
				: CombineInputs<Rest>
			: CombineInputs<Rest>
		: never
	: never;

type CombineInputs<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? TFuncs extends readonly PossibleCallback<infer In, infer _out>[]
		? In
		: never
	: never;

export function Parallel<
	const TFuncs,
	TInput extends BaseIO = CombineInputs<TFuncs>,
>(
	steps: TFuncs & ValidateFunctions<TFuncs>,
	_config?: OperationConfig<TInput>,
): OperationFunction<TInput, BaseIO> {
	return Operation<TInput, BaseIO>(async (input) => {
		const results = await Promise.all(
			steps.map((step) => Optional(step)(input)),
		);

		// biome-ignore lint/performance/noAccumulatingSpread: expected
		return results.reduce((acc, result) => ({ ...acc, ...result }), {});
	});
}

const p1 = Parallel([]);

const pa = Parallel([
	async () => ({
		name: 'John',
	}),
]);

pa(undefined);

const pb = Parallel([
	async (input: { id: string }) => ({
		id: input.id,
		name: 'John',
	}),
]);

const pc = Parallel([
	() => ({}),
	async (input: { id: string }) => ({
		id: input.id,
		name: 'John',
	}),
	async (input: { id: number; name: string }) => ({
		label: input.name,
	}),
]);

const a = pc(undefined);
