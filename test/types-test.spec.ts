import { expectTypeOf } from 'expect-type';
import { memoizeOne } from '../src/next';

it('should maintain the types of the original function', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getLocation(this: Window, value: number) {
    return this.location;
  }
  const memoized = memoizeOne(getLocation);

  expectTypeOf<ThisParameterType<typeof getLocation>>().toEqualTypeOf<
    ThisParameterType<typeof memoized>
  >();
  expectTypeOf<Parameters<typeof getLocation>>().toEqualTypeOf<Parameters<typeof memoized>>();
  expectTypeOf<ReturnType<typeof getLocation>>().toEqualTypeOf<ReturnType<typeof memoized>>();
});
