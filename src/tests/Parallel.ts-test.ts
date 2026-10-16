import { Parallel } from '#src/Parallel';
import { type OperationFunction } from '#src/types';
import { type Equal, type Expect } from './Base.ts-test';

// 1. Void inputs and outputs

const voidParallel = Parallel([() => {}, () => undefined, () => {}]);

voidParallel();

type VoidParallelType = Expect<
	Equal<typeof voidParallel, OperationFunction<void, undefined>>
>;

// 2. Single function

const singleParallel = Parallel([
	(input: { id: string }) => ({
		name: input.id,
	}),
]);

type SingleParallelType = Expect<
	Equal<
		typeof singleParallel,
		OperationFunction<{ id: string }, { name: string }>
	>
>;

singleParallel({ id: '1' });

// @ts-expect-error missing id
singleParallel({});

// @ts-expect-error wrong id type
singleParallel({ id: 1 });

// 3. Required inputs

const requiredParallel = Parallel([
	(input: { id: string }) => ({
		name: input.id,
	}),
	(input: { active: boolean }) => ({
		enabled: input.active,
	}),
]);

type RequiredParallelType = Expect<
	Equal<
		typeof requiredParallel,
		OperationFunction<
			{ id: string; active: boolean },
			{ name: string; enabled: boolean }
		>
	>
>;

requiredParallel({ id: '1', active: true });

// @ts-expect-error missing active
requiredParallel({ id: '1' });

// @ts-expect-error missing id
requiredParallel({ active: true });

// 4. Optional inputs

const optionalParallel = Parallel([
	(input?: { name: string }) => ({
		name: input?.name ?? 'Unknown',
	}),
	(input?: { age: number }) => ({
		age: input?.age ?? 0,
	}),
]);

type OptionalParallelInput = Expect<
	Equal<
		Parameters<typeof optionalParallel>[0],
		{ name?: string; age?: number } | undefined
	>
>;

type OptionalParallelOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof optionalParallel>>,
		{ name: string; age: number }
	>
>;

optionalParallel(undefined);
optionalParallel({});
optionalParallel({ name: 'John' });
optionalParallel({ age: 25 });
optionalParallel({ name: 'John', age: 25 });

// @ts-expect-error wrong name type
optionalParallel({ name: 123 });

// 5. Mixed required and optional inputs

const mixedParallel = Parallel([
	(input: { id: string }) => ({
		id: input.id,
	}),
	(input?: { active: boolean }) => ({
		active: input?.active ?? false,
	}),
	() => ({
		source: 'parallel',
	}),
]);

type MixedParallelInput = Expect<
	Equal<Parameters<typeof mixedParallel>[0], { id: string; active?: boolean }>
>;

type MixedParallelOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof mixedParallel>>,
		{ id: string; active: boolean; source: string }
	>
>;

mixedParallel({ id: '1' });
mixedParallel({ id: '1', active: true });

// @ts-expect-error missing required id
mixedParallel({ active: true });

// 6. Async results

const asyncParallel = Parallel([
	async (input: { id: string }) => ({
		name: input.id,
	}),
	async (input: { active: boolean }) => ({
		enabled: input.active,
	}),
]);

type AsyncParallelType = Expect<
	Equal<
		typeof asyncParallel,
		OperationFunction<
			{ id: string; active: boolean },
			{ name: string; enabled: boolean }
		>
	>
>;

// 7. Mixed sync and async results

const mixedAsyncParallel = Parallel([
	(input: { id: string }) => ({
		id: input.id,
	}),
	async () => ({
		status: 'ready',
	}),
	() => undefined,
]);

type MixedAsyncOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof mixedAsyncParallel>>,
		{ id: string; status: string }
	>
>;

// 8. Nullish outputs

const nullishParallel = Parallel([
	() => null,
	() => undefined,
	() => {},
	() => ({ success: true }),
]);

type NullishParallelOutput = Expect<
	Equal<Awaited<ReturnType<typeof nullishParallel>>, { success: true }>
>;

// 9. All optional / nullish outputs

const optionalResultsParallel = Parallel([
	(): { name: string } | undefined => undefined,
	(): { age: number } | null => null,
]);

type OptionalResultsOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof optionalResultsParallel>>,
		{ name?: string; age?: number } | undefined
	>
>;

// 10. Shared compatible properties

const sharedParallel = Parallel([
	(input: { id: string; name: string }) => ({
		id: input.id,
	}),
	(input: { id: string; active: boolean }) => ({
		active: input.active,
	}),
]);

type SharedParallelInput = Expect<
	Equal<
		Parameters<typeof sharedParallel>[0],
		{ id: string; name: string; active: boolean }
	>
>;

type SharedParallelOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof sharedParallel>>,
		{ id: string; active: boolean }
	>
>;

// 11. Conflicting primitive inputs

Parallel([
	() => ({}),

	// @ts-expect-error conflicting property 'id'
	(input: { id: string }) => ({
		name: input.id,
	}),

	// @ts-expect-error conflicting property 'id'
	(input: { id: number }) => ({
		age: input.id,
	}),
]);

// 12. Conflicting object and primitive inputs

Parallel([
	// @ts-expect-error expected to test primitives with objects conflicts
	(input: { data: { name: string } }) => ({}),
	// @ts-expect-error expected to test primitives with objects conflicts
	(input: { data: string }) => ({}),
]);

// 13. Missing and invalid input

requiredParallel({ id: '1', active: true });

// @ts-expect-error missing required properties
requiredParallel();

// @ts-expect-error invalid id type
requiredParallel({ id: 123, active: true });

// @ts-expect-error invalid active type
requiredParallel({ id: '1', active: 'yes' });

// 14. Invalid callbacks

// @ts-expect-error empty steps array
Parallel([]);

// @ts-expect-error invalid callback
Parallel([123]);

// @ts-expect-error invalid callback
Parallel([() => ({}), 'not a function']);

// @ts-expect-error invalid result type
Parallel([() => 'invalid result']);

// 15. Readonly tuple

const readonlySteps = [
	(input: { id: string }) => ({ id: input.id }),
	() => ({ active: true }),
] as const;

const readonlyParallel = Parallel(readonlySteps);

type ReadonlyParallelType = Expect<
	Equal<
		typeof readonlyParallel,
		OperationFunction<{ id: string }, { id: string; active: boolean }>
	>
>;
