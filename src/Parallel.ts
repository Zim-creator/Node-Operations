import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type BaseIOObject,
	type Fn,
	type OperationFunction,
	type PossibleCallback,
} from '#src/types';
import { Optional } from './Optional.js';

type ValidateFunc<TFunc> =
	TFunc extends PossibleCallback<infer In, infer Out>
		? [In, Out] extends BaseIO[]
			? TFunc
			: PossibleCallback
		: PossibleCallback;

type ValidateFunctions<TFuncs> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? Rest extends readonly []
		? [ValidateFunc<First>]
		: [ValidateFunc<First>, ...ValidateFunctions<Rest>]
	: [PossibleCallback, ...PossibleCallback[]];

type ExtractObj<TObj> = TObj extends BaseIO
	? undefined extends TObj
		? undefined
		: TObj
	: undefined;

type ValidateObjs<TFunc, TIn extends boolean> =
	TFunc extends PossibleCallback<infer In, infer Out>
		? TIn extends true
			? ExtractObj<In>
			: ExtractObj<Out>
		: 1;

type GetObjs<TFuncs, TIn extends boolean = false> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? Rest extends readonly []
		? [ValidateObjs<First, TIn>]
		: [ValidateObjs<First, TIn>, ...GetObjs<Rest, TIn>]
	: [undefined];

export function Parallel<
	const TFuncs,
	TInput = GetObjs<TFuncs, true>,
	TResult = GetObjs<TFuncs>,
>(
	steps: TFuncs & ValidateFunctions<TFuncs>,
	_config?: OperationConfig<TInput>,
): OperationFunction<TInput, TResult> {
	return Operation<TInput, TResult>(async (input) => {
		const results = await Promise.all(
			steps.map((step) => Optional(step)(input)),
		);

		// biome-ignore lint/performance/noAccumulatingSpread: expected
		return results.reduce((acc, result) => ({ ...acc, ...result }), {});
	});
}

const pa = Parallel([]);

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
