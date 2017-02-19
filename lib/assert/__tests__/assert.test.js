/* eslint-env browser, jest */

import {
  assertRegExp,
  assertPlainObject,
  assertFunction,
  assertArray,
  assertRedundantProps
} from '../index';



describe('assertFunction', () => {
  it('should throws', () => {
    expect(() => {
      assertFunction('some', {});
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertFunction('some', () => {});
    }).not.toThrow();
  });
});




describe('assertPlainObject', () => {
  it('should throws', () => {
    expect(() => {
      assertPlainObject('some', 123);
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertPlainObject('some', {});
    }).not.toThrow();
  });
});








describe('assertRegExp', () => {
  it('should throws', () => {
    expect(() => {
      assertRegExp(/hello/, 'some', 123);
    }).toThrow();
    expect(() => {
      assertRegExp(/hello/, 'some', 'hell');
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertRegExp(/hello/, 'some', 'hello dolly');
    }).not.toThrow();
  });
});




describe('assertArray', () => {
  it('should throws', () => {
    expect(() => {
      assertArray('some', 123);
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertArray('some', []);
    }).not.toThrow();
  });
});




describe('assertRedundantProps', () => {
  it('should throws', () => {
    expect(() => {
      assertRedundantProps('some', { a: 3 });
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertRedundantProps('some', {});
    }).not.toThrow();
  });
});
