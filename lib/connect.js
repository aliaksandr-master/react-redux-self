import React, { PropTypes, Component } from 'react';
import { assertArray, assertFunction, assertRedundantProps, assertPlainObject } from './assert';
import { isFunction, each, reduce } from './utils';
import { connect as reduxConnect } from 'react-redux';
import { assertRegExp } from './assert';
import { createSelector } from 'reselect';
import { denormalize as denormalizeEntities } from 'normalizr';
import logError from './logError';




let REDUCER_NAME = 'self';
let ACTION_PREFIX = `@@${REDUCER_NAME}:`;
let MOUNT_ACTION = `${ACTION_PREFIX}MOUNT_COMPONENT`;
let UNMOUNT_ACTION = `${ACTION_PREFIX}UNMOUNT_COMPONENT`;
let DB_REDUCER_NAME = 'entities';

export const configure = ({ entitiesReducerName, reducerName }) => {
  if (entitiesReducerName) {
    DB_REDUCER_NAME = entitiesReducerName;
  }

  if (reducerName) {
    REDUCER_NAME = reducerName;
    ACTION_PREFIX = `@@${REDUCER_NAME}:`;
    MOUNT_ACTION = `${ACTION_PREFIX}MOUNT_COMPONENT`;
    UNMOUNT_ACTION = `${ACTION_PREFIX}UNMOUNT_COMPONENT`;
  }
};




export const actionsFactory = (componentName = '') => (actionName) => {
  if (process.env.NODE_ENV !== 'production') {
    assertRegExp(/^[a-zA-Z0-9$_]+$/, 'action name', actionName);
    assertRegExp(/^[a-zA-Z0-9$_]+$/, 'component name', componentName);
  }

  return `${ACTION_PREFIX}${componentName}/${actionName}`;
};

const mountSelfComponent = (selfID, reducer) => ({
  type: MOUNT_ACTION,
  meta: { selfID },
  payload: { reducer }
});

const unmountSelfComponent = (selfID) => ({
  type: UNMOUNT_ACTION,
  meta: { selfID },
  payload: {}
});



// REDUCER
const reducers = {};

const unregisterSelfReducer = (selfID) => {
  reducers[selfID] = null; // it is best way to remove function and runaway from problems with GC
};

const registerSelfReducer = (selfID, reducer) => {
  if (reducers.hasOwnProperty(selfID)) {
    throw new Error(`duplicate selfID "${selfID}"`);
  }

  reducers[selfID] = reducer;
};

const selfReducer = (state = {}, action) => {
  if (!action.type.startsWith(ACTION_PREFIX)) {
    return state;
  }

  if (!action.meta || !action.meta.selfID) {
    logError(`invalid action.meta (action.type="${action.type}"). it must have selfID property`);
    return state;
  }

  const selfID = action.meta.selfID;

  if (action.type === UNMOUNT_ACTION) {
    return omit(state, selfID);
  }

  if (!reducers[selfID] || !reducers.hasOwnProperty(selfID)) {
    return state;
  }

  return {
    ...state,
    [selfID]: reducers[selfID](state[selfID], action)
  };
};

export { selfReducer as reducer };


const wrapDispatch = (dispatch, selfID) =>
  (action) => {
    if (isFunction(action)) {
      return dispatch((dispatch, ...args) =>
        action(wrapDispatch(dispatch, selfID), ...args) // thunk
      );
    }

    if (!String(action.type).startsWith(ACTION_PREFIX)) {
      return dispatch(action);
    }

    if (!action.meta) {
      action = {
        ...action,
        meta: { selfID }
      };
    } else if (!action.meta.selfID) {
      action.meta = {
        ...action.meta,
        selfID
      };
    }

    return dispatch(action);
  };


const hoc = ({ selfID, reducer, attachSelfIDProp }) => (Target) => {
  const selfIDPrefix = String(Target.displayName || Target.name);
  const displayName = `Self(${selfIDPrefix})`;
  let counter = 0;

  return class extends Component {
    static contextTypes = {
      store: PropTypes.shape({ dispatch: PropTypes.func.isRequired })
    };

    static propTypes = {
      ...propTypes,
      selfID: PropTypes.string
    };

    static displayName = displayName;

    componentWillMount () {
      this._$selfID = this.props.selfID || selfID || `${selfIDPrefix}:${++counter}`;

      registerSelfReducer(this._$selfID, reducer);

      this.context.store.dispatch(mountSelfComponent(this._$selfID));
    }

    componentWillUnmount () {
      this.context.store.dispatch(unmountSelfComponent(this._$selfID));

      unregisterSelfReducer(this._$selfID);
    }

    render () {
      if (attachSelfIDProp) {
        return (
          <Target {...this.props} selfID={this._$selfID} />
        );
      }
      return (
        <Target {...this.props} />
      );
    }
  };
};


export const connect = ({
  selfID = null,
  attachSelfIDProp = false,
  reducer = null,
  getters = null,
  selector = null,
  denormalize = null,
  mapDispatchToProps = null,
  mergeProps = null,
  connectOptions = null,
  propTypes = {},
  ...other
}) => {
  if (reducer && getters === null && selector === null) {
    getters = [ (self) => self ];
    selector = (self) => self;
  }



  // check
  assertFunction('reducer', reducer);
  assertFunction('selector', selector);
  assertArray('getters', getters);
  assertRedundantProps('connectSelf', other);
  assertPlainObject('propTypes', propTypes);
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
      reducer ? (_1, store) => store[DB_REDUCER_NAME] : (store) => store[DB_REDUCER_NAME]
    ];

    selector = (...args) => {
      const db = args[args.length - 1];

      return reduce(denormalize, (result, schema, propPath) => {
        const propValue = result[propPath];

        return {
          ...result,
          [propPath]: propValue == null ? null : denormalizeEntities(propValue, schema, db)
        };
      }, selector(...args));
    };
  }



  if (reducer) {
    getters = getters.map((getter) =>
      (storeState, props) => getter(storeState[REDUCER_NAME][props.selfID], storeState, props)
    );
  }

  const mapToProps = () => createSelector(getters, selector);



  if (mapDispatchToProps !== null) {
    mapDispatchToProps = (dispatch, props, ...args) => {
      const wrappedDispatch = wrapDispatch(dispatch, props.selfID);

      if (isFunction(mapDispatchToProps)) {
        return mapDispatchToProps(wrappedDispatch, props, ...args);
      }

      return reduce(mapDispatchToProps, (map, func, name) => {
        if (!isFunction(func)) {
          throw new Error(`mapDispatchToProps[${name}] is not a function`);
        }

        map[name] = (...args) => wrappedDispatch(func(...args));

        return map;
      }, {});
    };
  }



  return (Target) =>
    reduxConnect(mapToProps, mapDispatchToProps, mergeProps, connectOptions)(
      hoc({ selfID, reducer, attachSelfIDProp })(
        Target
      )
    );
};
