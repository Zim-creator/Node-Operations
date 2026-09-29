import { describe, expect, it, vi } from 'vitest';
import { Operation } from '#src/Operation';
import { Pipe } from '#src/Pipe';

describe('Pipe', () => {
	it('executes steps sequentially', async () => {
		const first = Operation(async (input: { value: number }) => ({
			value: input.value + 1,
		}));

		const second = Operation(async (input: { value: number }) => ({
			value: input.value * 2,
		}));

		const pipe = Pipe([first, second]);

		await expect(pipe({ value: 2 })).resolves.toEqual({
			value: 6,
		});
	});

	it('passes result of previous step into next step', async () => {
		const second = vi.fn(async (input: { value: number }) => input);

		const pipe = Pipe([
			async (input: { value: number }) => ({
				value: input.value + 10,
			}),
			second,
		]);

		await pipe({ value: 5 });

		expect(second).toHaveBeenCalledWith({ value: 15 }, expect.any(Object));
	});

	it('shares context between steps', async () => {
		const cache = new Map<string, Promise<unknown>>();

		const first = Operation(async (input: { value: number }, ctx) => {
			expect(ctx.cache).toBe(cache);
			return input;
		});

		const second = Operation(async (input: { value: number }, ctx) => {
			expect(ctx.cache).toBe(cache);
			return input;
		});

		const pipe = Pipe([first, second]);

		await pipe({ value: 1 }, { cache });
	});

	it('supports asynchronous steps', async () => {
		const pipe = Pipe([
			async (input: { value: number }) => {
				await Promise.resolve();

				return {
					value: input.value + 1,
				};
			},
			async (input: { value: number }) => {
				await Promise.resolve();

				return {
					value: input.value + 1,
				};
			},
		]);

		await expect(pipe({ value: 1 })).resolves.toEqual({
			value: 3,
		});
	});

	it('stops execution when a step throws', async () => {
		const finalStep = vi.fn();

		const pipe = Pipe([
			async (input: { value: number }) => input,
			async (_input: { value: number }) => {
				throw new Error('failure');
			},
			finalStep,
		]);

		await expect(pipe({ value: 1 })).rejects.toThrow('failure');

		expect(finalStep).not.toHaveBeenCalled();
	});

	it('throws when no steps are provided', () => {
		expect(() => Pipe([])).toThrow('Error: empty array');
	});
});
