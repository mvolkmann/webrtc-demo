export function back() {
  window.history.back();
}

export function getBodyCssVar(name, defaultValue) {
  const cssVar = getComputedStyle(document.body).getPropertyValue(name);
  return cssVar || defaultValue;
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Sorts an array of objects on a given property
// in ascending, case-insensitive order.
export function sortCaseInsensitive(arr, property) {
  arr.sort(function (obj1, obj2) {
    const value1 = obj1[property];
    const value2 = obj2[property];
    return value1.toLowerCase().localeCompare(value2.toLowerCase());
  });
  return arr;
}
