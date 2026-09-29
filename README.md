# Node Operations

Reusable typed operations for Node.js and Next.js.

`@zim-creator/node-operations` provides small composable primitives for building backend workflows with predictable input/output types, shared execution context, optional caching, and type-safe pipelines.

## Core concepts

An **Operation** is an async function with:

- typed input
- typed output
- shared operation context
- optional cache support
- metadata that identifies it as an operation

Operations can be composed with utilities such as `Pipe` and `Optional`.

## Operation

Create an operation from a handler:

```ts
import { Operation } from '@zim-creator/node-operations';

const getUser = Operation(async ({ id }: { id: string }) => {
	return {
		id,
		name: 'John',
	};
});
```

Operations always return a `Promise`.

```ts
const user = await getUser({ id: '1' });
```

### Context

Every operation receives an execution context as its second argument.

```ts
const operation = Operation(async (input, ctx) => {
	console.log(ctx.cache);

	return input;
});
```

The context can be passed between composed operations.

## Caching

Caching can be enabled with `cache: true` and a cache key.

```ts
const getUser = Operation(
	async ({ id }: { id: string }) => {
		return {
			id,
			name: 'John',
		};
	},
	{
		cache: true,
		key: ({ id }) => `user:${id}`,
	},
);
```

A static key can also be used:

```ts
const getConfig = Operation(
	async () => {
		return {
			featureEnabled: true,
		};
	},
	{
		cache: true,
		key: 'config',
	},
);
```

Cache entries store execution promises, allowing concurrent executions with the same key and context to share the same operation result.

An empty key disables caching.

### Cache factory with React

By default, each operation call without an explicit cache creates a new `Map`. Use `setOperationCacheFactory` to control how those calls obtain their cache.

For React Server Components (including Next.js), configure the factory once at module scope in a shared server module, before calling operations:

```ts
import { cache } from 'react';
import { Operation } from '@zim-creator/node-operations';
import { setOperationCacheFactory } from '@zim-creator/node-operations/store';

setOperationCacheFactory(
	cache(() => new Map<string, Promise<unknown>>()),
);

export const getCachedUser = Operation(
	async ({ id }: { id: string }) => ({ id, name: 'John' }),
	{
		cache: true,
		key: ({ id }) => `user:${id}`,
	},
);
```

Import that operation into a Server Component:

```tsx
import { getCachedUser } from './operations';

export default async function UserPage() {
	const [user, sameUser] = await Promise.all([
		getCachedUser({ id: '1' }),
		getCachedUser({ id: '1' }),
	]);

	// Both calls share one handler execution and resolve to the same result.
	return <p>{user.name}</p>;
}
```

React's `cache` shares the map within a server request and invalidates it for each new request. This requires the React Server Component cache context; calls outside that context do not share the map through React. See the [React cache documentation](https://react.dev/reference/react/cache).

Operations still need `cache: true` and a non-empty key. Keys share a namespace within the map, so include an operation prefix and all inputs that affect the result. An explicitly supplied `ctx.cache` takes precedence over the factory.

### Existing operations

Calling `Operation` with an existing operation returns that operation unchanged.

```ts
const original = Operation(async (input: { id: string }) => input);

const sameOperation = Operation(original);
```

An existing operation keeps its original configuration. New configuration passed while wrapping it does not replace its existing behavior.

## Pipe

`Pipe` executes operations sequentially.

The result of each step becomes the input of the next step.

```ts
import { Operation, Pipe } from '@zim-creator/node-operations';

const getUser = Operation(async ({ id }: { id: string }) => {
	return {
		id,
		name: 'John',
	};
});

const getProfile = Operation(async (user: { id: string; name: string }) => {
	return {
		...user,
		profileUrl: `/users/${user.id}`,
	};
});

const getUserProfile = Pipe([
	getUser,
	getProfile,
]);

const profile = await getUserProfile({ id: '1' });
```

`Pipe` validates compatible input and output types between steps at compile time.

An empty pipeline is not allowed.

## Optional

`Optional` converts an operation into a non-blocking step.

If the wrapped handler:

- returns a value, that value is returned
- returns `null` or `undefined`, the original input is returned
- throws an error, the original input is returned

```ts
import { Operation, Optional, Pipe } from '@zim-creator/node-operations';

const enrichUser = Optional(
	Operation(async (user: { id: string; name: string }) => {
		const enrichment = await loadOptionalData(user.id);

		if (!enrichment) {
			return undefined;
		}

		return {
			...user,
			...enrichment,
		};
	}),
);

const processUser = Pipe([
	enrichUser,
]);
```

This makes `Optional` useful for pipeline steps that should not interrupt the remaining workflow when they cannot produce a result.

## BaseIO

Operation inputs and outputs are designed around object-based data.

A top-level `BaseIO` value is an object, or an empty result represented by `null`, `undefined`, or `void`.

Objects can contain:

- strings
- numbers
- booleans
- `null`
- `Date`
- nested objects
- arrays containing supported values

Example:

```ts
type UserInput = {
	id: string;
	options: {
		active: boolean;
	};
	tags: string[];
	createdAt: Date;
};
```

Primitive values such as `string` or `number` are not intended to be used directly as top-level operation input or output.

## Shared cache context

A cache can be provided manually through the operation context.

```ts
const cache = new Map<string, Promise<unknown>>();

await getUser(
	{ id: '1' },
	{
		cache,
	},
);
```

Passing the same cache to multiple operations allows them to share cached executions.

## Exports

Main package exports:

```ts
import {
	Operation,
	Optional,
	Pipe,
	setOperationCacheFactory,
} from '@zim-creator/node-operations';
```

Types:

```ts
import type {
	BaseIO,
	OperationConfig,
	OperationContext,
	OperationFunction,
	OperationHandler,
	OperationMeta,
} from '@zim-creator/node-operations';
```

Individual entry points are also available:

```ts
import { Operation } from '@zim-creator/node-operations/operation';
import { Optional } from '@zim-creator/node-operations/optional';
import { Pipe } from '@zim-creator/node-operations/pipe';
import { setOperationCacheFactory } from '@zim-creator/node-operations/store';
```

## Status

The package is currently under active development.

Additional operation primitives, including parallel execution utilities, are planned.

## License

MIT
