import { createSelector } from 'reselect';
import { assertArray, assertFunction, assertPlainObject } from './assert';
import { isFunction } from './utils';
import { getDenormalizeEntitiesGetter, getDenormalizeFunction } from './config';




export default (wrapper) => ({
  // self
  selfID = null,
  reducer = null,

  // recelect
  getters = null, // deprecated
  selector = null, // deprecated
  pick = null,

  // denoarmalization (normalizr params)
  denormalize = null,
  denormalizeEntitiesGetter = getDenormalizeEntitiesGetter(),
  denormalizeFunction = getDenormalizeFunction(),
  ...other
}) => {
  if (reducer !== null) {
    assertFunction('reducer', reducer);
  }

  if (selector === null && getters === null) {
    if (reducer === null) {
      getters = [];
      selector = () => ({});
    } else {
      getters = [ (self) => self ];
      selector = (self) => self;
    }
  }

  assertFunction('selector', selector);
  assertArray('getters', getters);
  getters.forEach((getter, index) => assertFunction(`getter[${index}]`, getter));

  if (pick !== null && pick.length) {
    throw new Error('pick function must have no arguments');
  }

  if (denormalize !== null) {
    if (!isFunction(denormalize)) {
      assertPlainObject('denormalize', denormalize);
    }
  }

  const selectorFactory = () => {
    let select = pick ? pick() : createSelector(getters, selector);

    if (denormalize !== null) {
      if (isFunction(denormalize)) {
        select = createSelector([ select, denormalizeEntitiesGetter ], (result, db) => denormalize(result, db, denormalizeFunction));
      } else {

        const keys = Object.keys(denormalize);

        const deSelect = createSelector([
          (db, props) => db,
          ...keys.map((key) => (db, result) => result[key])
        ], (db, ...props) => keys.reduce((deResult, key, index) => {
          const propValue = props[index];
          const schema = denormalize[key];

          deResult[key] = propValue == null ? null : denormalizeFunction(propValue, schema, db);

          return deResult;
        }, {}));

        select = createSelector([ select, denormalizeEntitiesGetter ], (result, db) => ({ ...result, ...deSelect(db, result) }));
      }
    }

    return select;
  };

  return wrapper({
    ...other,
    selectorFactory,
    selfID,
    reducer
  });
};
