import { isFunction, isPlainObject } from '../utils';



const getObjectType = (value) => Object.prototype.toString.call(value);



export const assertRegExp = (exp, name, value) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be string`);
  }

  if (!exp.test(value)) {
    throw new Error(`${name} "${value}" has invalid format`);
  }
};

export const assertPlainObject = (name, value) => {
  if (!isPlainObject(value)) {
    throw new TypeError(`${name} must be plain object, "${getObjectType(value)}" given`);
  }
};

export const assertFunction = (name, value) => {
  if (!isFunction(value)) {
    throw new TypeError(`${name} must be function, "${getObjectType(value)}" given`);
  }
};

export const assertArray = (name, value) => {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be array, "${getObjectType(value)}" given`);
  }
};

export const assertRedundantProps = (name, obj) => {
  assertPlainObject(name, obj);

  const invalidProps = Object.keys(obj);

  if (invalidProps.length) {
    throw new Error(`${name} has redundant props [${invalidProps.join(',')}]`);
  }
};
