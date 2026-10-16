# Node Operations

Reusable, typed operations for Node.js and Next.js.

`@zim-creator/node-operations` provides composable primitives for backend workflows: typed async functions, sequential and parallel composition, optional steps, shared execution context, and opt-in promise caching.

## Installation

```bash
yarn add github:Zim-creator/Node-Operations
```

## Core concepts

An **Operation** is an asynchronous function with typed input and output, an optional execution context, and metadata (`__isOperation`) identifying it as an operation.

Use:

- **`Operation`** to wrap a handler and optionally cache its execution.
- **`Pipe`** to pass each step's result into the next step.
- **`Parallel`** to run steps concurrently with the same input and combine their results.
- **`Optional`** to make a step fall back to its input on failure or a nullish result.

## Operation

```ts
import { Operation } from '@zim-creator/node-operations';

const getUser = Operation(async ({ id }: { id: string }) => ({
  id,
  name: 'John',
}));

const user = await getUser({ id: '1' });
```

Operations always return a `Promise`. The handler may be synchronous or asynchronous.

### Execution context

The handler receives a context as its second argument. Composed operations forward that context to their steps.

```ts
const inspect = Operation(async (input: { id: string }, ctx) => {
  console.log(ctx?.cache);
  return input;
});
```

### Caching

Caching is opt-in and requires a non-empty key, either static or derived from the input.

```ts
const cachedUser = Operation(
  async ({ id }: { id: string }) => ({ id, name: 'John' }),
  {
    cache: true,
    key: ({ id }) => `user:${id}`,
  },
);
```

The cache stores promises, so calls using the same key and cache can share an in-flight execution. Failed executions are removed from the cache. A static key is useful for a handler whose result is independent of its input.

**Cache keys share a namespace within a cache.** Prefix keys or otherwise ensure uniqueness when different operations share the same cache. Collisions are caller-managed. An empty key disables caching.

By default, `getOperationCache()` creates a new `Map` for each invocation. To share results across calls, supply the same cache via context or configure a cache factory.

```ts
const cache = new Map<string, Promise<unknown>>();

await cachedUser({ id: '1' }, { cache });
await cachedUser({ id: '1' }, { cache }); // Reuses the promise
```

### Cache factory for React Server Components

To share a cache within a React server request (for example in Next.js), configure the factory in a shared server module:

```ts
import { cache } from 'react';
import { setOperationCacheFactory } from '@zim-creator/node-operations/store';

setOperationCacheFactory(
  cache(() => new Map<string, Promise<unknown>>()),
);
```

React's `cache` provides request-scoped sharing in the supported server rendering context; outside that context, it does not provide the same sharing guarantee. An explicitly provided `ctx.cache` takes precedence over the factory.

### Wrapping existing operations

Passing an existing operation to `Operation` returns the same operation unchanged:

```ts
const sameOperation = Operation(cachedUser);
console.log(sameOperation === cachedUser); // true
```

New configuration supplied while wrapping an existing operation does **not** replace the original configuration.

## Pipe

`Pipe` executes steps sequentially. Each step's result becomes the next step's input.

```ts
import { Pipe } from '@zim-creator/node-operations';

const getProfile = Pipe([
  async (input: { id: string }) => ({
    id: input.id,
    name: 'John',
  }),
  (user: { id: string; name: string }) => ({
    label: `${user.name} (${user.id})`,
  }),
]);

const profile = await getProfile({ id: '1' });
// { label: 'John (1)' }
```

The public input type comes from the first step, and the result type comes from the last step. `Pipe` performs compile-time checks of adjacent step types. An empty pipeline is not allowed.

## Parallel

`Parallel` executes all steps concurrently using `Promise.all`. Every step receives **the same input and context**, rather than the previous step's output. Results are combined in step order using a **shallow object spread**.

```ts
import { Parallel } from '@zim-creator/node-operations';

const getSummary = Parallel([
  async (input: { id: string }) => ({
    name: `User ${input.id}`,
  }),
  async (input: { active: boolean }) => ({
    active: input.active,
  }),
]);

const summary = await getSummary({ id: '1', active: true });
// { name: 'User 1', active: true }
```

Input types are inferred from the steps. Required object fields are combined; fields supplied only by optional input types may become optional in the combined signature. Incompatible overlapping fields are intended to be flagged by the type-level validator.

Nullish step results are ignored in the result reduction. If no step yields a mergeable result, the runtime returns `undefined`. If any step throws, `Parallel` rejects with that error.

### Shallow result merging

**Nested objects are not deeply merged.** When multiple results contain the same key, the later result overwrites the earlier one at runtime:

```ts
const getData = Parallel([
  () => ({ data: { name: 'John' } }),
  () => ({ data: { age: 25 } }),
]);

await getData();
// { data: { age: 25 } }
```

**Current limitation:** Result type inference uses intersection-based merging and may not accurately describe overwrites of duplicate keys (especially nested objects). Avoid overlapping output keys when you need runtime results and inferred types to agree.

### Parallel caching and context

`Parallel` accepts an optional `Operation` configuration, so the combined execution can be cached. Its steps receive the shared execution context.

```ts
const summaryOperation = Parallel([
  (input: { id: string }) => ({ id: input.id }),
  () => ({ source: 'parallel' }),
], {
  cache: true,
  key: ({ id }) => `summary:${id}`,
});
```

## Optional

`Optional` wraps a handler so failures do not interrupt a workflow. It returns the original input if the handler throws or returns `null` or `undefined`; otherwise, it returns the handler's result.

```ts
import { Optional, Pipe } from '@zim-creator/node-operations';

const enrichUser = Optional(async (user: { id: string; name: string }) => {
  const extra = user.id === '1' ? { verified: true } : undefined;
  return extra ? { ...user, ...extra } : undefined;
});

const flow = Pipe([enrichUser]);
```

Since an error can cause the input to be returned, the result type includes the original input as a possible outcome. `Optional` intentionally suppresses thrown errors; use it only for steps whose failure is acceptable.

## BaseIO

Operation inputs and outputs are designed around object-based data. A top-level `BaseIO` is an object, `null`, `undefined`, or `void`.

Supported object properties include strings, numbers, booleans, `null`, `undefined`, `Date`, nested objects, and arrays of supported values.

```ts
type UserInput = {
  id: string;
  options?: {
    active: boolean;
  };
  tags: string[];
  createdAt: Date;
};
```

Primitive top-level outputs such as `string` and `number` are not part of the intended `BaseIO` contract.

## Public exports

```ts
import {
  Operation,
  Optional,
  Pipe,
  Parallel,
  setOperationCacheFactory,
} from '@zim-creator/node-operations';

import type {
  BaseIO,
  OperationConfig,
  OperationContext,
  OperationFunction,
  OperationHandler,
  OperationMeta,
} from '@zim-creator/node-operations';
```

Individual entry points are also supported:

```ts
import { Operation } from '@zim-creator/node-operations/operation';
import { Optional } from '@zim-creator/node-operations/optional';
import { Pipe } from '@zim-creator/node-operations/pipe';
import { Parallel } from '@zim-creator/node-operations/parallel';
import { setOperationCacheFactory } from '@zim-creator/node-operations/store';
```

## Development

```bash
yarn build   # Compile the library
yarn test    # Run runtime tests
yarn check   # Run Biome checks
```

Type-level assertions are maintained in `src/tests/*.ts-test.ts` and should be checked using the project's dedicated type-test configuration.

## TODO

- [ ] **Parallel optional input safety:** A callback declared with an optional object input can receive a non-nullish partial object that is missing fields required by that callback. Revisit input validation or invocation semantics.
- [ ] **Pipe validation:** Review `CompareFunc` behavior with `void`, `undefined`, `null`, and optional parameters, and add regression type tests.
- [ ] **Parallel result inference:** Align type-level merging with shallow runtime overwrite behavior for duplicate output keys.

## Status

The library is under active development. Some type-level edge cases are documented above and remain subject to change.

## License

MIT