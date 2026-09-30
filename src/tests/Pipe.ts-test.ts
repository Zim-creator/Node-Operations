import { Pipe } from '#src/Pipe';
import { type OperationFunction } from '#src/types';
import { type Equal, type Expect } from './Base.ts-test';

const pipe = Pipe([
	async (input: { id: string }) => ({
		id: input.id,
		name: 'John',
	}),
	async (input: { id: string; name: string }) => ({
		label: input.name,
	}),
]);

type PipeType = Expect<
	Equal<typeof pipe, OperationFunction<{ id: string }, { label: string }>>
>;

type PipeInput = Parameters<typeof pipe>[0];

type PipeInputType = Expect<Equal<PipeInput, { id: string }>>;

type PipeOutput = Awaited<ReturnType<typeof pipe>>;

type PipeOutputType = Expect<Equal<PipeOutput, { label: string }>>;

pipe({ id: '1' });

// @ts-expect-error missing id
pipe({});

// @ts-expect-error wrong id type
pipe({ id: 1 });

Pipe([
	// @ts-expect-error next step needs age not name
	async (input: { id: string }) => ({
		name: input.id,
	}),

	async (input: { age: number }) => ({
		age: input.age,
	}),
]);

const extendedPipe = Pipe([
	async (input: { id: string; active: boolean }) => ({
		id: input.id,
		active: input.active,
		name: 'John',
	}),
	async (input: { id: string; name: string }) => ({
		id: input.id,
		label: input.name,
	}),
]);

type ExtendedInput = Expect<
	Equal<
		Parameters<typeof extendedPipe>[0],
		{
			id: string;
			active: boolean;
		}
	>
>;

type ExtendedOutput = Expect<
	Equal<
		Awaited<ReturnType<typeof extendedPipe>>,
		{
			id: string;
			label: string;
		}
	>
>;

const asyncPipe = Pipe([
	async (input: { value: number }) => ({
		value: input.value + 1,
	}),
	async (input: { value: number }) => ({
		value: input.value * 2,
	}),
]);

type AsyncOutput = Expect<
	Equal<Awaited<ReturnType<typeof asyncPipe>>, { value: number }>
>;
