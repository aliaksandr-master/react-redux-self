import isFunction from 'lodash/isFunction';
import each from 'lodash/each';
import omit from 'lodash/omit';
import reduce from 'lodash/reduce';
import isPlainObject from 'lodash/isPlainObject';


export {
  each,
  omit,
  isPlainObject,
  reduce,
  isFunction
};

export const logError = (...args) => {
  if (typeof console === 'undefined' || typeof console.error !== 'function') {
    return;
  }

  console.error && console.error(...args);
};
