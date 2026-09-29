import { describe, expect, it } from 'vitest';
import { Optional } from '#src/Optional';

describe('Optional', () => {
	it('returns handler result', async () => {
		const operation = Optional(async (input: { value: number }) => ({
			value: input.value * 2,
		}));

		await expect(operation({ value: 2 })).resolves.toEqual({
			value: 4,
		});
	});

	it('returns original input when handler returns undefined', async () => {
		const input = { value: 2 };

		const operation = Optional(async (_input: typeof input) => undefined);

		await expect(operation(input)).resolves.toBe(input);
	});

	it('returns original input when handler returns null', async () => {
		const input = { value: 2 };

		const operation = Optional(async (_input: typeof input) => null);

		await expect(operation(input)).resolves.toBe(input);
	});

	it('returns original input when handler throws', async () => {
		const input = { value: 2 };

		const operation = Optional(async (_input: typeof input) => {
			throw new Error('failure');
		});

		await expect(operation(input)).resolves.toBe(input);
	});

	it('passes context to wrapped handler', async () => {
		const cache = new Map<string, Promise<unknown>>();

		const operation = Optional(
			async (input: { value: number }, ctx: { cache?: object }) => {
				expect(ctx.cache).toBe(cache);

				return input;
			},
		);

		await operation({ value: 1 }, { cache });
	});
});
