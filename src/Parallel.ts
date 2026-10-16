import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type BaseIOObject,
	type Fn,
	type OperationFunction,
	type PossibleCallback,
} from '#src/types';

type ValidatedIO<TObj, TCompare> = [TCompare] extends [BaseIOObject]
	? [TObj] extends [BaseIOObject]
		? {
				[K in keyof TObj]: K extends keyof TCompare
					? [TCompare[K]] extends [never]
						? {
								__error: 'Conflicting property';
								property: K;
							}
						: TObj[K]
					: never;
			}
		: TObj
	: TObj;

type ValidateFunc<TFunc, TInput, TResult> =
	TFunc extends Fn<infer Ins, infer Outs>
		? Ins[0] extends infer In extends BaseIO
			? Awaited<Outs> extends infer Out extends BaseIO
				? PossibleCallback<
						ValidatedIO<In, TInput>,
						ValidatedIO<Out, TResult>
					>
				: PossibleCallback<In>
			: PossibleCallback
		: PossibleCallback;

type ValidateFunctions<TFuncs, TInput, TResult> = TFuncs extends readonly [
	unknown,
	...unknown[],
]
	? {
			[I in keyof TFuncs]: ValidateFunc<TFuncs[I], TInput, TResult>;
		}
	: [PossibleCallback, ...PossibleCallback[]];

// 1. Extract inputs or results into a tuple

type GetIO<TFuncs, TIO extends boolean> = TFuncs extends readonly Fn[]
	? {
			[I in keyof TFuncs]: TFuncs[I] extends Fn<infer In, infer Out>
				? TIO extends true
					? In extends []
						? undefined
						: In[0]
					: Awaited<Out>
				: never;
		}
	: [];

// 2. Extract required objects

type RequiredObjects<T extends readonly unknown[]> = T extends readonly [
	infer First,
	...infer Rest,
]
	? [First] extends [BaseIOObject]
		? [First, ...RequiredObjects<Rest>]
		: RequiredObjects<Rest>
	: [];

// 3. Extract optional objects

type OptionalObjects<T extends readonly unknown[]> = T extends readonly [
	infer First,
	...infer Rest,
]
	? [NonNullable<First>] extends [never]
		? OptionalObjects<Rest>
		: [NonNullable<First>] extends [BaseIOObject]
			? [First] extends [BaseIOObject]
				? OptionalObjects<Rest>
				: [NonNullable<First>, ...OptionalObjects<Rest>]
			: OptionalObjects<Rest>
	: [];

// 4. Combine objects using intersection

type DeepIntersect<A, B> = {
	[K in keyof A | keyof B]: K extends keyof A
		? K extends keyof B
			? [A[K]] extends [BaseIOObject]
				? [B[K]] extends [BaseIOObject]
					? DeepIntersect<A[K], B[K]>
					: never
				: [B[K]] extends [BaseIOObject]
					? never
					: A[K] & B[K]
			: A[K]
		: K extends keyof B
			? B[K]
			: never;
};

type IntersectAll<T extends readonly unknown[]> = T extends readonly [
	infer First,
	...infer Rest,
]
	? DeepIntersect<First, IntersectAll<Rest>>
	: // biome-ignore lint/complexity/noBannedTypes: expected
		{};

type Simplify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

// 5. Merge required and optional objects

type MergeIO<T extends readonly unknown[]> =
	RequiredObjects<T> extends infer R extends readonly unknown[]
		? OptionalObjects<T> extends infer O extends readonly unknown[]
			? R extends []
				? O extends []
					? undefined
					: Simplify<Partial<IntersectAll<O>>> | undefined
				: O extends []
					? Simplify<IntersectAll<R>>
					: Simplify<IntersectAll<R> & Partial<IntersectAll<O>>>
			: never
		: never;

// 6. Final types

type GetInputs<TFuncs> = Extract<MergeIO<GetIO<TFuncs, true>>, BaseIO>;

type GetResults<TFuncs> = Extract<MergeIO<GetIO<TFuncs, false>>, BaseIO>;

export function Parallel<
	const TFuncs,
	TInput extends BaseIO = GetInputs<TFuncs> extends infer Input extends BaseIO
		? [Input] extends [undefined]
			? void
			: Input
		: void,
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

const a = Parallel([
	(input: { data: { name: string } }) => ({}),
	(input: { data: {} }) => ({}),
]);
