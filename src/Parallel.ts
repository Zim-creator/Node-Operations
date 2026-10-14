import { Operation, type OperationConfig } from '#src/Operation';
import {
	type BaseIO,
	type BaseIOObject,
	type Fn,
	type OperationFunction,
	type PossibleCallback,
} from '#src/types';
import { Optional } from './Optional.js';

type IsNever<T> = [T] extends [never] ? true : false;

type IsSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// A step that never returns (or takes `never`) can't conflict with anything
type SharedKeys<A, B> = true extends IsNever<A> | IsNever<B>
	? never
	: keyof A & keyof B & string;

// Paths of fields that no single input value can satisfy for both steps
type InputFieldConflicts<A, B, TPath extends string> =
	IsNever<A & B> extends true
		? TPath
		: [A, B] extends [readonly (infer ItemA)[], readonly (infer ItemB)[]]
			? InputFieldConflicts<ItemA, ItemB, `${TPath}[]`>
			: [A, B] extends [BaseIOObject, BaseIOObject]
				? InputConflicts<A, B, `${TPath}.`>
				: never;

type InputConflicts<A, B, TPrefix extends string = ''> = {
	[K in SharedKeys<A, B>]: InputFieldConflicts<A[K], B[K], `${TPrefix}${K}`>;
}[SharedKeys<A, B>];

// Results are merged shallowly, so a shared field must have the same type
type ResultConflicts<A, B> = [A, B] extends [BaseIOObject, BaseIOObject]
	? {
			[K in SharedKeys<A, B>]: IsSame<A[K], B[K]> extends true
				? never
				: K;
		}[SharedKeys<A, B>]
	: never;

type StepIndex<TFuncs> = Extract<keyof TFuncs, `${number}`>;

type StepErrors<TFuncs, I extends keyof TFuncs> = {
	[J in Exclude<StepIndex<TFuncs>, I>]:
		| `Parallel: input field "${InputConflicts<
				GetObject<TFuncs[I], true>,
				GetObject<TFuncs[J & keyof TFuncs], true>
		  >}" conflicts with steps[${J}]`
		| `Parallel: result field "${ResultConflicts<
				GetObject<TFuncs[I], false>,
				GetObject<TFuncs[J & keyof TFuncs], false>
		  >}" conflicts with steps[${J}]`;
}[Exclude<StepIndex<TFuncs>, I>];

type ValidateFunc<TFunc, TErrors> =
	TFunc extends PossibleCallback<infer _In, infer _Out>
		? IsNever<TErrors> extends true
			? TFunc
			: TErrors
		: PossibleCallback;

type ValidateFunctions<TFuncs> = TFuncs extends readonly [unknown, ...unknown[]]
	? { [I in keyof TFuncs]: ValidateFunc<TFuncs[I], StepErrors<TFuncs, I>> }
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
	steps: TFuncs & ValidateFunctions<TFuncs>,
	_config?: OperationConfig<TInput>,
): OperationFunction<TInput, TResult> {
	return Operation(async (input?: TInput) => {
		const results = await Promise.all(
			steps.map((step) => Optional(step)(input)),
		);

		return results.reduce((acc, result) => {
			if (!result) return acc;

			if (!acc) {
				acc = {};
			}

			// biome-ignore lint/performance/noAccumulatingSpread: expected
			return { ...acc, ...result };
		}, undefined);
	}) as OperationFunction<TInput, TResult>;
}
