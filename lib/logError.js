
export default (...args) => {
  if (typeof console === 'undefined' || typeof console.error !== 'function') {
    return;
  }

  console.error && console.error(...args);
};
