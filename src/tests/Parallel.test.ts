import { describe, expect, it, vi } from 'vitest';
import { Operation } from '#src/Operation';
import { Parallel } from '#src/Parallel';

describe('Parallel', () => {
	it.todo('returns an operation', async () => {
		const parallel = Parallel([async (input: { id: string }) => input]);

		expect(parallel.__isOperation).toBe(true);
	});

	it.todo('executes all steps with the same input', async () => {
		const first = vi.fn(async (input: { id: string }) => ({
			name: `user-${input.id}`,
		}));

		const second = vi.fn(async (input: { id: string }) => ({
			email: `${input.id}@example.com`,
		}));

		const parallel = Parallel([first, second]);

		await parallel({ id: '1' });

		expect(first).toHaveBeenCalledWith({ id: '1' }, expect.any(Object));

		expect(second).toHaveBeenCalledWith({ id: '1' }, expect.any(Object));
	});

	it.todo('merges results from all steps', async () => {
		const parallel = Parallel([
			async (_input: { id: string }) => ({
				name: 'John',
			}),
			async (_input: { id: string }) => ({
				email: 'john@example.com',
			}),
		]);

		await expect(parallel({ id: '1' })).resolves.toEqual({
			name: 'John',
			email: 'john@example.com',
		});
	});

	it.todo('executes steps concurrently', async () => {
		let resolveFirst!: () => void;
		let resolveSecond!: () => void;

		const firstStarted = vi.fn();
		const secondStarted = vi.fn();

		const parallel = Parallel([
			async (_input: { id: string }) => {
				firstStarted();

				await new Promise<void>((resolve) => {
					resolveFirst = resolve;
				});

				return {
					first: true,
				};
			},
			async (_input: { id: string }) => {
				secondStarted();

				await new Promise<void>((resolve) => {
					resolveSecond = resolve;
				});

				return {
					second: true,
				};
			},
		]);

		const execution = parallel({ id: '1' });

		await Promise.resolve();

		expect(firstStarted).toHaveBeenCalledOnce();
		expect(secondStarted).toHaveBeenCalledOnce();

		resolveFirst();
		resolveSecond();

		await expect(execution).resolves.toEqual({
			first: true,
			second: true,
		});
	});

	it.todo('shares the same context between steps', async () => {
		const cache = new Map<string, Promise<unknown>>();

		const first = Operation(async (input: { id: string }, ctx) => {
			expect(ctx.cache).toBe(cache);

			return {
				first: input.id,
			};
		});

		const second = Operation(async (input: { id: string }, ctx) => {
			expect(ctx.cache).toBe(cache);

			return {
				second: input.id,
			};
		});

		const parallel = Parallel([first, second]);

		await parallel({ id: '1' }, { cache });
	});

	it.todo('supports different input requirements between steps', async () => {
		const parallel = Parallel([
			async (input: { id: string }) => ({
				id: input.id,
			}),
			async (input: { enabled: boolean }) => ({
				enabled: input.enabled,
			}),
		]);

		await expect(
			parallel({
				id: '1',
				enabled: true,
			}),
		).resolves.toEqual({
			id: '1',
			enabled: true,
		});
	});

	it.todo('propagates an error when a step fails', async () => {
		const error = new Error('failure');

		const parallel = Parallel([
			async (_input: { id: string }) => ({
				first: true,
			}),
			async (_input: { id: string }) => {
				throw error;
			},
		]);

		await expect(parallel({ id: '1' })).rejects.toBe(error);
	});

	it.todo('supports operation configuration', async () => {
		const handler = vi.fn(async (_input: { id: string }) => ({
			value: true,
		}));

		const parallel = Parallel([handler], {
			cache: true,
			key: ({ id }) => `parallel:${id}`,
		});

		const cache = new Map<string, Promise<unknown>>();

		await parallel({ id: '1' }, { cache });
		await parallel({ id: '1' }, { cache });

		expect(handler).toHaveBeenCalledOnce();
	});
});
