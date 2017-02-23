import React, { PropTypes, Component } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { createSelector } from 'reselect';
import { logError, omit, isFunction, reduce, each } from '../utils';
import { mountActionType, unmountActionType, reducerName, actionTypePrefix } from '../config';
import { assertFunction, assertPlainObject, assertRedundantProps } from '../assert';



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
  if (!action.type.startsWith(actionTypePrefix())) {
    return state;
  }

  if (!action.meta || !action.meta.selfID) {
    logError(`invalid action.meta (action.type="${action.type}"). it must have selfID property`);
    return state;
  }

  const selfID = action.meta.selfID;

  if (action.type === unmountActionType()) {
    return omit(state, selfID);
  }

  const reducer = reducers[selfID];

  if (!reducer || !reducers.hasOwnProperty(selfID)) {
    return state;
  }

  return {
    ...state,
    [selfID]: reducer(state[selfID], action)
  };
};

export { selfReducer as reducer };




const attachReducerAndSetSelfIDHOC = ({ selfID, reducer }) => (Target) => {
  const selfIDPrefix = String(Target.displayName || Target.name).replace(/^Connect\((.+?)\)$/, '$1');
  const displayName = `Self(${selfIDPrefix})`;
  let counter = 0;

  return class extends Component {
    static displayName = displayName;

    static contextTypes = {
      store: PropTypes.shape({ dispatch: PropTypes.func.isRequired })
    };

    static propTypes = {
      selfID: PropTypes.string
    };

    constructor (...args) {
      super(...args);

      this._$selfID = this.props.selfID || selfID || `${selfIDPrefix}:${++counter}`;

      registerSelfReducer(this._$selfID, reducer);
    }

    componentWillMount () {

      this.context.store.dispatch({
        type: mountActionType(),
        meta: { selfID: this._$selfID },
        payload: {}
      });
    }

    componentWillUnmount () {
      this.context.store.dispatch({
        type: unmountActionType(),
        meta: { selfID: this._$selfID },
        payload: {}
      });

      unregisterSelfReducer(this._$selfID);
    }

    render () {
      return (
        <Target {...this.props} selfID={this._$selfID} />
      );
    }
  };
};




const wrapDispatch = (dispatch, selfID) =>
  (action) => {
    if (isFunction(action)) {
      return dispatch((dispatch, ...args) =>
        action(wrapDispatch(dispatch, selfID), ...args) // thunk
      );
    }

    if (!String(action.type).startsWith(actionTypePrefix())) {
      return dispatch(action);
    }

    if (!action.meta) {
      action = {
        ...action,
        meta: { selfID }
      };
    } else if (!action.meta.selfID) {
      action.meta = {
        ...action.meta || {},
        selfID
      };
    }

    return dispatch(action);
  };


export default ({
  selfID,
  reducer,
  getters,
  selector,

  // connect
  mapDispatchToProps = null,
  mergeProps = null,
  connectOptions = {},

  ...other
}) => (Target) => {
  assertRedundantProps('connect-to-global-store', other);

  if (reducer) {
    getters = getters.map((getter) =>
      (globalStoreState, props) => {
        return getter(globalStoreState[reducerName()][props.selfID], globalStoreState, props);
      }
    );
  } else {
    getters = getters.map((getter) =>
      (globalStoreState, props) => getter(null, globalStoreState, props)
    );
  }

  const mapStateToProps = () => createSelector(getters, selector);

  if (reducer !== null) {
    if (mapDispatchToProps !== null) {
      if (!isFunction(mapDispatchToProps)) {
        assertPlainObject('mapDispatchToProps', mapDispatchToProps);
        each(mapDispatchToProps, (actionCreator, name) => assertFunction(`mapDispatchToProps[${name}]`, actionCreator));
      }

      const _mapDispatchToProps = mapDispatchToProps;

      mapDispatchToProps = (dispatch, props, ...args) => {
        const wrDispatch = wrapDispatch(dispatch, props.selfID);

        if (isFunction(_mapDispatchToProps)) {
          return _mapDispatchToProps(wrDispatch, props, ...args);
        }

        return reduce(_mapDispatchToProps, (map, func, name) => {
          if (!isFunction(func)) {
            throw new Error(`mapDispatchToProps[${name}] is not a function`);
          }

          map[name] = (...args) => wrDispatch(func(...args));

          return map;
        }, {});
      };
    }

    return attachReducerAndSetSelfIDHOC({ selfID, reducer })(reduxConnect(mapStateToProps, mapDispatchToProps, mergeProps, connectOptions)(Target));
  }

  return reduxConnect(mapStateToProps, mapDispatchToProps, mergeProps, connectOptions)(Target);
};
