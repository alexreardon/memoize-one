// Cannot use Number.isNumber as it is not supported in IE11
function ourIsNaN(value: unknown): boolean {
  return typeof value === 'number' && value !== value;
}

function hasChanged(first: unknown, second: unknown): boolean {
  if (first === second) {
    return false;
  }

  // Special case for NaN (NaN !== NaN)
  if (ourIsNaN(first) && ourIsNaN(second)) {
    return false;
  }

  return true;
}

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
