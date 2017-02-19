import { createSelector } from 'reselect';
import { assertRegExp, assertArray, assertFunction, assertRedundantProps, assertPlainObject } from './assert';
import { each, reduce } from './utils';
import { entitiesReducerName, reducerName, getSelfIDProp, getConnectionType, getDenormalizeFunction } from './config';
import wrapGlobalStoreComponent from './wrappers/global-store-connect';


export const connect = ({
  // selfId
  selfID = null,
  selfIDProp = getSelfIDProp(),

  // basic
  reducer = null,
  getters = null,
  selector = null,
  connectionType = getConnectionType(),

  propTypes = {},

  // connect
  mergeProps = null,
  connectOptions = null,
  mapDispatchToProps = null,

  // denoarmalization
  denormalize = null,
  denormalizeFunction = getDenormalizeFunction(),
  ...other
}) => {
  if (reducer && getters === null && selector === null) {
    getters = [ (self) => self ];
    selector = (self) => self;
  }

  assertFunction('reducer', reducer);
  assertFunction('selector', selector);
  assertArray('getters', getters);
  assertRedundantProps('connectSelf', other);
  assertPlainObject('propTypes', propTypes);
  assertRegExp(/^[a-zA-Z][a-zA-Z0-9$_]+$/, 'self ID prop name', selfIDProp);
  getters.forEach((getter) => assertFunction('getter', getter));

  if (mapDispatchToProps !== null) {
    assertPlainObject('mapDispatchToProps', mapDispatchToProps);
    each(mapDispatchToProps, (actionCreator, name) =>
      assertFunction(`mapDispatchToProps[${name}]`, actionCreator)
    );
  }

  if (denormalize !== null) {
    assertPlainObject('denormalize', denormalize);
    getters = [
      ...getters,
      reducer ? (_1, store) => store[entitiesReducerName()] : (store) => store[entitiesReducerName()]
    ];

    selector = (...args) => {
      const db = args[args.length - 1];

      return reduce(denormalize, (result, schema, propPath) => {
        const propValue = result[propPath];

        return {
          ...result,
          [propPath]: propValue == null ? null : denormalizeFunction(propValue, schema, db)
        };
      }, selector(...args));
    };
  }

  if (reducer) {
    getters = getters.map((getter) =>
      (storeState, props) => getter(storeState[reducerName()][props[selfIDProp]], storeState, props)
    );
  } else {
    getters = getters.map((getter) =>
      (storeState, props) => getter(null, storeState, props)
    );
  }

  const mapToProps = () => createSelector(getters, selector);

  if (connectionType === 'global') {
    return wrapGlobalStoreComponent({
      mapToProps,
      mapDispatchToProps,
      mergeProps,
      connectOptions,
      selfID,
      reducer,
      selfIDProp,
      propTypes
    });
  }

  throw new Error(`invalid connection type "${connectionType}"`);
};
