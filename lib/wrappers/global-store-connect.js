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



let selfComponentsCounter = 0;



const attachReducerAndSetSelfIDHOC = ({ selfID: componentSelfID, reducer }) => (Target) => {
  const baseNumber = ++selfComponentsCounter;
  const selfIDPrefix = getSelfIdByComponentName() ? String(Target.displayName || Target.name || `C${(baseNumber)}`) : `C${(baseNumber)}`;
  let counter = 0;

  const calcSelfID = (propsSelfID) => propsSelfID || componentSelfID || `${selfIDPrefix}:${baseNumber}:${++counter}`;

  const Cmp = class extends Component {

    constructor (...args) {
      super(...args);

      this._$$selfID = calcSelfID(this.props.selfID);
    }

    _register () {
      if (reducersMap.has(this._$$selfID)) {
        throw new ReferenceError(`selfID "${this._$$selfID}" has already mounted`);
      }

      reducersMap.set(this._$$selfID, reducer);

      this.props.$$selfMount(this._$$selfID);
    }

    _unregister () {
      this.props.$$selfUnmount(this._$$selfID);

      reducersMap.delete(this._$$selfID);
    }

    componentDidMount () {
      this._register();
    }

    componentWillUnmount () {
      this._unregister();
    }

    UNSAFE_componentWillUpdate (nextProps) {
      if (this.props.selfID !== nextProps.selfID) {
        this._unregister();
        this._$$selfID = calcSelfID(nextProps.selfID);
        this._register();
      }
    }

    render () {
      return (<Target {...this.props} selfID={this._$$selfID} />);
    }
  };

  Cmp.displayName = `Self(${selfIDPrefix})`;

  Cmp.propTypes = {
    selfID: PropTypes.string,
    $$selfMount: PropTypes.func,
    $$selfUnmount: PropTypes.func
  };

  return Cmp;
};




const wrapDispatch = (dispatch, selfID) => (action) => {
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

    const $$selfMount = (selfID) => ({
      type: mountActionType(),
      meta: { selfID },
      payload: {}
    });

    const $$selfUnmount = (selfID) => ({
      type: unmountActionType(),
      meta: { selfID },
      payload: {}
    });

    mapDispatchToProps = {
      ...mapDispatchToProps || {},
      $$selfMount,
      $$selfUnmount
    };

    return reduxConnect(mapStateToProps, mapDispatchToProps, mergeProps, connectOptions)(attachReducerAndSetSelfIDHOC({ selfID, reducer })(Target));
  }

  return reduxConnect(mapStateToProps, mapDispatchToProps, mergeProps, connectOptions)(Target);
};
