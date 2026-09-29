import { Operation } from '#src/Operation';
import { type OperationFunction } from '#src/types';
import { type Equal, type Expect } from './Base.ts-test';

const operation = Operation(async (input: { id: string }) => ({
	name: input.id,
}));

type OperationType = Expect<
	Equal<typeof operation, OperationFunction<{ id: string }, { name: string }>>
>;

type Input = Parameters<typeof operation>[0];

type InputType = Expect<Equal<Input, { id: string }>>;

type Output = Awaited<ReturnType<typeof operation>>;

type OutputType = Expect<Equal<Output, { name: string }>>;

operation({ id: '1' });

// @ts-expect-error missing id
operation({});

// @ts-expect-error wrong id type
operation({ id: 1 });

const syncOperation = Operation((input: { value: number }) => ({
	value: input.value * 2,
}));

type SyncOutput = Expect<
	Equal<Awaited<ReturnType<typeof syncOperation>>, { value: number }>
>;

const cachedOperation = Operation(
	async (input: { id: string }) => ({
		id: input.id,
	}),
	{
		cache: true,
		key: ({ id }) => id,
	},
);

cachedOperation({ id: '1' });

// @ts-expect-error cache=true requires key
Operation(async (input: { id: string }) => input, {
	cache: true,
});

Operation(async (input: { id: string }) => input, {
	cache: true,
	// @ts-expect-error key callback input must match operation input
	key: (input: { value: number }) => String(input.value),
});

const existingOperation = Operation(async (input: { id: string }) => ({
	id: input.id,
}));

const sameOperation = Operation(existingOperation);

type ExistingOperationType = Expect<
	Equal<typeof sameOperation, typeof existingOperation>
>;
