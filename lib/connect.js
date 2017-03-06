import { assertArray, assertFunction, assertPlainObject } from './assert';
import { reduce, isFunction } from './utils';
import { getDenormalizeEntitiesGetter, getConnectionType, getDenormalizeFunction } from './config';
import wrapGlobalStoreComponent from './wrappers/global-store-connect';




export const connect = ({
  // self
  selfID = null,
  reducer = null,
  connectionType = getConnectionType(),

  // recelect
  getters = null,
  selector = null,

  // denoarmalization (normalizr params)
  denormalize = null,
  denormalizeEntitiesGetter = getDenormalizeEntitiesGetter(),
  denormalizeFunction = getDenormalizeFunction(),
  ...other
}) => {
  if (reducer && getters === null && selector === null) {
    getters = [ (self) => self ];
    selector = (self) => self;
  }

  if (reducer !== null) {
    assertFunction('reducer', reducer);
  }

  assertFunction('selector', selector);
  assertArray('getters', getters);
  getters.forEach((getter, index) => assertFunction(`getter[${index}]`, getter));

  if (denormalize !== null) {
    getters = [
      ...getters,
      denormalizeEntitiesGetter
    ];

    const _selector = selector;

    if (isFunction(denormalize)) {
      selector = (...args) => denormalize(_selector(...args), args[args.length - 1], denormalizeFunction);
    } else {
      assertPlainObject('denormalize', denormalize);

      selector = (...args) => {
        const db = args[args.length - 1];

        return reduce(denormalize, (result, schema, propPath) => {
          const propValue = result[propPath];

          return {
            ...result,
            [propPath]: propValue == null ? null : denormalizeFunction(propValue, schema, db)
          };
        }, _selector(...args));
      };
    }
  }

  if (connectionType === 'global') {
    return wrapGlobalStoreComponent({
      ...other,
      getters,
      selector,
      selfID,
      reducer
    });
  }

  throw new Error(`invalid connection type "${connectionType}"`);
};
