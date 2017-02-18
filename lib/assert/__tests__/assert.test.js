/* eslint-env browser, jest */

import {
  assertRegExp,
  assertAvailableValues,
  assertPlainObject,
  assertAvailableProps,
  assertUniq,
  assertInstanceOf,
  assertFunction,
  assertArray,
  assertRedundantProps,
  assertTrimmedNonEmptyString
} from '../index';


describe('assertAvailableValues', () => {
  it('should throws', () => {
    expect(() => {
      assertAvailableValues([], 'some', 1);
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertAvailableValues([ 1 ], 'some', 1);
    }).not.toThrow();
  });
});



describe('assertAvailableProps', () => {
  it('should throws', () => {
    expect(() => {
      assertAvailableProps([], 'some', { a: 3 });
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertAvailableProps([ 'a' ], 'some', { a: 3 });
    }).not.toThrow();
  });
});




describe('assertUniq', () => {
  it('should throws', () => {
    expect(() => {
      assertUniq('some', [ 1, 2, 3, 1 ]);
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertUniq('some', [ 1, 2, 3 ]);
    }).not.toThrow();
  });
});




describe('assertInstanceOf', () => {
  const Some = class {};

  it('should throws', () => {
    expect(() => {
      assertInstanceOf(Some, 'some', {});
    }).toThrow();
    expect(() => {
      assertInstanceOf([ Some ], 'some', {});
    }).toThrow();
  });

  it('should pass', () => {
    expect(() => {
      assertInstanceOf(Some, 'some', new Some());
    }).not.toThrow();

    expect(() => {
      assertInstanceOf([ Some ], 'some', new Some());
    }).not.toThrow();
  });
});




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




describe('assertTrimmedNonEmptyString', () => {
  it('should throws', () => {
    expect(() => {
      assertTrimmedNonEmptyString('some', 123);
    }).toThrow();
    expect(() => {
      assertTrimmedNonEmptyString('some', '');
    }).toThrow();
    expect(() => {
      assertTrimmedNonEmptyString('some', '  ');
    }).toThrow();
  });
  it('should pass', () => {
    expect(() => {
      assertTrimmedNonEmptyString('some', '123');
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
