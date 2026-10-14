import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type BaseIOObject,
	type Fn,
	type OperationFunction,
	type PossibleCallback,
} from '#src/types';

type ValidateIO<TIn, TCompare extends BaseIO> = TIn extends BaseIO
	? TIn extends BaseIOObject
		? TCompare extends BaseIOObject
			? TIn extends Partial<TCompare>
				? true
				: false
			: true
		: true
	: false;

type ExtractIncompatibleParams<
	TObj extends BaseIO,
	TCompare extends BaseIO,
	TResult = [TObj, TCompare] extends BaseIOObject[]
		? { [K in Extract<keyof TCompare, keyof TObj>]: TCompare[K] }
		: never,
> = TResult extends BaseIOObject ? TResult : never;

type ValidateFunc<TFunc, TInputs extends BaseIO, TResults extends BaseIO> =
	TFunc extends PossibleCallback<infer In, infer Out>
		? [ValidateIO<In, TInputs>, ValidateIO<Out, TResults>] extends true[]
			? TFunc
			: PossibleCallback<
					ExtractIncompatibleParams<In, TInputs>,
					ExtractIncompatibleParams<Out, TResults>
				>
		: PossibleCallback;

type ValidateFunctions<
	TFuncs,
	TInputs extends BaseIO,
	TResults extends BaseIO,
> = TFuncs extends readonly [infer First, ...infer Rest]
	? Rest extends readonly []
		? [ValidateFunc<First, TInputs, TResults>]
		: [
				ValidateFunc<First, TInputs, TResults>,
				...ValidateFunctions<Rest, TInputs, TResults>,
			]
	: [PossibleCallback, ...PossibleCallback[]];

type GetObject<TFunc, TIn extends boolean> =
	TFunc extends Fn<infer In, infer Out>
		? TIn extends true
			? In[0]
			: Awaited<Out>
		: never;

type GetObjectsArray<TFuncs, TIn extends boolean> = TFuncs extends readonly [
	infer First,
	...infer Rest,
]
	? Rest extends readonly []
		? [GetObject<First, TIn>]
		: [GetObject<First, TIn>, ...GetObjectsArray<Rest, TIn>]
	: [];

type RequiredOnly<TObjects extends unknown[]> = TObjects extends readonly [
	infer First,
	...infer Rest,
]
	? First extends BaseIOObject
		? [First, ...RequiredOnly<Rest>]
		: RequiredOnly<Rest>
	: [];

type CombineObjects<TObjects extends unknown[]> = TObjects extends readonly [
	infer First,
	...infer Rest,
]
	? First & CombineObjects<Rest>
	: // biome-ignore lint/complexity/noBannedTypes: expected
		{};

type GetInputs<
	TFuncs,
	TObjects extends unknown[] = GetObjectsArray<TFuncs, true>,
	TRequired extends BaseIOObject[] = RequiredOnly<TObjects>,
	// biome-ignore lint/suspicious/noConfusingVoidType: expected
> = TRequired extends readonly [] ? void : CombineObjects<TRequired>;

type GetResults<
	TFuncs,
	TObjects extends unknown[] = GetObjectsArray<TFuncs, false>,
	TRequired extends BaseIOObject[] = RequiredOnly<TObjects>,
> = TRequired extends readonly [] ? undefined : CombineObjects<TRequired>;

export function Parallel<
	const TFuncs,
	TInput extends BaseIO = GetInputs<TFuncs>,
	TResult extends BaseIO = GetResults<TFuncs>,
>(
	steps: TFuncs & ValidateFunctions<TFuncs, TInput, TResult>,
	config?: OperationConfig<TInput>,
): OperationFunction<TInput, TResult> {
	return Operation(async (input: TInput, ctx) => {
		const results = await Promise.all(
			steps.map((step) => Operation(step)(input, ctx)),
		);

		return results.reduce((acc, result) => {
			if (!result) return acc;

			if (!acc) {
				acc = {};
			}

			// biome-ignore lint/performance/noAccumulatingSpread: expected
			return { ...acc, ...result };
		}, undefined);
	}, config) as OperationFunction<TInput, TResult>;
}

// const a = Parallel([(i?: { b: string }) => {}, (i?: { b: string }) => {}]);
