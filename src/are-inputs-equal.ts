export default function areInputsEqual(
  newInputs: readonly unknown[],
  lastInputs: readonly unknown[],
): boolean {
  // no checks needed if the inputs length has changed
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  // Using for loop for speed. It generally performs better than array.every
  // https://github.com/alexreardon/memoize-one/pull/59

  for (let i = 0; i < newInputs.length; i++) {
    if (hasChanged(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}

// compare whether a value has changed, accounting for NaN
function hasChanged(newValue: unknown, oldValue: unknown) {
  return newValue !== oldValue && (newValue === newValue || oldValue === oldValue);
}
