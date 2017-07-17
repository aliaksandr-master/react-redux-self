import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { logError, omit, isFunction, reduce, each } from '../utils';
import { mountActionType, unmountActionType, reducerName, actionTypePrefix, getSelfIdByComponentName } from '../config';
import { assertFunction, assertPlainObject, assertRedundantProps } from '../assert';



const reducersMap = new Map();

const selfReducer = (state = {}, action) => {
  if (!action.type.startsWith(actionTypePrefix())) {
    return state;
  }

  if (!action.hasOwnProperty('meta') || !action.meta.selfID) {
    logError(`invalid action.meta (action.type="${action.type}"). it must have selfID property`);
    return state;
  }

  const selfID = action.meta.selfID;

  if (action.type === unmountActionType()) {
    return omit(state, selfID);
  }

  if (!reducersMap.has(selfID)) {
    return state;
  }

  const reducer = reducersMap.get(selfID);

  return {
    ...state,
    [selfID]: reducer(state[selfID], action) // mount action need for initializing state
  };
};

export { selfReducer as reducer };



let globalCounter = 0;



const attachReducerAndSetSelfIDHOC = ({ selfID: copmponentSelfID, reducer }) => (Target) => {
  const selfIDPrefix = getSelfIdByComponentName() ? String(Target.displayName || Target.name || `C${(globalCounter++)}`) : `C${(globalCounter++)}`;
  let counter = 0;
  const base = globalCounter++;

  return class extends Component {
    static displayName = `Self(${selfIDPrefix})`;

    static contextTypes = {
      store: PropTypes.shape({ dispatch: PropTypes.func.isRequired })
    };

    static propTypes = {
      selfID: PropTypes.string
    };

    constructor (...args) {
      super(...args);

      this._$selfID = this.props.selfID || copmponentSelfID || `${selfIDPrefix}:${base}:${++counter}`;
    }

    _dispatch (type) {
      this.context.store.dispatch({
        type,
        meta: { selfID: this._$selfID },
        payload: {}
      });
    }

    _register () {
      if (reducersMap.has(this._$selfID)) {
        throw new ReferenceError(`selfID "${this._$selfID}" has already mounted`);
      }

      reducersMap.set(this._$selfID, reducer);

      this._dispatch(mountActionType());
    }

    _unregister () {
      this._dispatch(unmountActionType());

      reducersMap.delete(this._$selfID);
    }

    componentWillMount () {
      this._register();
    }

    componentWillUnmount () {
      this._unregister();
    }

    componentWillUpdate (nextProps) {
      if (this.props.selfID !== nextProps.selfID) {
        this._unregister();
        this._$selfID = nextProps.selfID;
        this._register();
      }
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

  selectorFactory,

  // connect
  mapDispatchToProps = null,
  mergeProps = null,
  connectOptions = {},

  ...other
}) => (Target) => {
  assertRedundantProps('connect-to-global-store', other);

  const mapStateToProps = reducer
    ? (
      () => {
        const select = selectorFactory();
        const currentReducerName = reducerName();

        return (globalStoreState, props) => select(globalStoreState[currentReducerName][props.selfID], globalStoreState, props);
      }
    ) : (
      () => {
        const select = selectorFactory();

        return (globalStoreState, props) => select(null, globalStoreState, props);
      }
    );

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
