export function back() {
  window.history.back();
}

export function sortCaseInsensitive(arr) {
  arr.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  return arr;
}
