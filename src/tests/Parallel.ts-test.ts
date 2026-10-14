import { Parallel } from '#src/Parallel';

const parallel = Parallel([
	async (input: { id: string; name: number }) => ({
		id: input.id,
		name: 'asd',
		s: 22,
	}),
	(input: { id: string }) => ({
		id: input.id,
		name: 'John',
	}),
]);

parallel({ id: '1', name: 1 });

// @ts-expect-error missing name
parallel({ id: '1' });

const voidInputParallel = Parallel([
	() => ({ b: 'asd' }),
	(input: { id: string }) => ({
		id: input.id,
		name: 'John',
	}),
]);

voidInputParallel({ id: '1' });

Parallel([(_input: { a: string }) => {}]);

Parallel([
	async (_input: { id: string }) => ({
		first: true,
	}),
	async (_input: { id: string }) => {
		throw new Error('failure');
	},
]);

Parallel([
	// @ts-expect-error input field "id" conflicts with steps[1]
	async (input: { id: string }) => ({
		first: input.id,
	}),
	// @ts-expect-error input field "id" conflicts with steps[0] and steps[2]
	async (input: { id: number }) => ({
		second: input.id,
	}),
	// @ts-expect-error input field "id" conflicts with steps[1]
	async (input: { id: string }) => ({
		third: input.id,
	}),
]);

Parallel([
	// @ts-expect-error input field "user.id" conflicts with steps[1]
	async (input: { user: { id: string } }) => ({
		first: input.user.id,
	}),
	// @ts-expect-error input field "user.id" conflicts with steps[0]
	async (input: { user: { id: number } }) => ({
		second: input.user.id,
	}),
]);

Parallel([
	// @ts-expect-error input field "tags[]" conflicts with steps[1]
	async (input: { tags: string[] }) => ({
		first: input.tags,
	}),
	// @ts-expect-error input field "tags[]" conflicts with steps[0]
	async (input: { tags: number[] }) => ({
		second: input.tags,
	}),
]);

Parallel([
	// @ts-expect-error result field "label" conflicts with steps[1]
	async (input: { id: string }) => ({
		label: input.id,
	}),
	// @ts-expect-error result field "label" conflicts with steps[0]
	async (_input: { id: string }) => ({
		label: 1,
	}),
]);

Parallel([
	// @ts-expect-error result field "user" conflicts with steps[1]
	async (input: { id: string }) => ({
		user: { id: input.id },
	}),
	// @ts-expect-error result field "user" conflicts with steps[0]
	async (_input: { id: string }) => ({
		user: { name: 'John' },
	}),
]);
