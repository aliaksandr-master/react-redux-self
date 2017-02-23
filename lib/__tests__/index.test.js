/*eslint-env jest, browser*/

test('should import lib without errors', () => {
  expect(() => {
    require('../index'); // eslint-disable-line global-require
  }).not.toThrow();
});
