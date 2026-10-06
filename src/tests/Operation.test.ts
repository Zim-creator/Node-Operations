import { describe, expect, it, vi } from 'vitest';
import { Operation } from '#src/Operation';
import { type OperationCache } from '#src/store';

describe('Operation', () => {
	it('executes handler with input', async () => {
		const operation = Operation(async (input: { value: number }) => ({
			value: input.value * 2,
		}));

		await expect(operation({ value: 2 })).resolves.toEqual({
			value: 4,
		});
	});

	it('marks function as operation', () => {
		const operation = Operation(async (input: { value: number }) => input);

		expect(operation.__isOperation).toBe(true);
	});

	it('returns existing operation unchanged', () => {
		const operation = Operation(async (input: { value: number }) => input);

		const wrapped = Operation(operation, {
			cache: true,
			key: 'ignored',
		});

		expect(wrapped).toBe(operation);
	});

	it('passes provided cache through context', async () => {
		const cache: OperationCache = new Map();

		const operation = Operation(async (input: { value: number }, ctx) => {
			expect(ctx?.cache).toBe(cache);

			return input;
		});

		await operation({ value: 1 }, { cache });
	});

	it('caches execution using static key', async () => {
		const handler = vi.fn(async (input: { value: number }) => input);

		const operation = Operation(handler, {
			cache: true,
			key: 'test',
		});

		const cache: OperationCache = new Map();

		const first = operation({ value: 1 }, { cache });
		const second = operation({ value: 2 }, { cache });

		expect(await first).toEqual({ value: 1 });
		expect(await second).toEqual({ value: 1 });

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('caches execution using generated key', async () => {
		const handler = vi.fn(async (input: { id: string }) => input);

		const operation = Operation(handler, {
			cache: true,
			key: ({ id }) => id,
		});

		const cache: OperationCache = new Map();

		await operation({ id: '1' }, { cache });
		await operation({ id: '1' }, { cache });
		await operation({ id: '2' }, { cache });

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('does not cache when cache is disabled', async () => {
		const handler = vi.fn(async (input: { value: number }) => input);

		const operation = Operation(handler);

		const cache: OperationCache = new Map();

		await operation({ value: 1 }, { cache });
		await operation({ value: 1 }, { cache });

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('does not cache empty keys', async () => {
		const handler = vi.fn(async (input: { value: number }) => input);

		const operation = Operation(handler, {
			cache: true,
			key: '',
		});

		const cache: OperationCache = new Map();

		await operation({ value: 1 }, { cache });
		await operation({ value: 1 }, { cache });

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('propagates handler errors', async () => {
		const error = new Error('failure');

		const operation = Operation(async (_input: { value: number }) => {
			throw error;
		});

		await expect(operation({ value: 1 })).rejects.toBe(error);
	});
});
