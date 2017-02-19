import React, { PropTypes, Component } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { logError, omit, isFunction, reduce } from '../utils';
import { mountActionType, unmountActionType, actionTypePrefix } from '../config';



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

  const selfID = action.meta.selfID;

  if (!action.meta || !selfID) {
    logError(`invalid action.meta (action.type="${action.type}"). it must have selfID property`);
    return state;
  }

  if (action.type === unmountActionType()) {
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




const hoc = ({ selfID, reducer, selfIDProp, propTypes = {} }) => (Target) => {
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
      this._$selfProps = selfID ? { [selfID]: this._$selfID } : null;

      registerSelfReducer(this._$selfID, reducer);

      this.context.store.dispatch({
        type: mountActionType(),
        meta: { selfID: this._$selfID },
        payload: {}
      });
    }

    componentWillUnmount () {
      this.context.store.dispatch({
        type: unmountActionType(),
        meta: { selfID },
        payload: {}
      });

      unregisterSelfReducer(this._$selfID);
    }

    render () {
      if (this._$selfProps) {
        return (
          <Target {...this.props} {...this._$selfProps} />
        );
      }
      return (
        <Target {...this.props} />
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


export default (mapToProps, mapDispatchToProps, mergeProps, connectOptions, selfID, reducer, selfIDProp, propTypes) => (Target) => {
  if (mapDispatchToProps !== null) {
    mapDispatchToProps = (dispatch, props, ...args) => {
      const wrappedDispatch = wrapDispatch(dispatch, props[selfIDProp]);

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

  return reduxConnect(mapToProps, mapDispatchToProps, mergeProps, connectOptions)(
    hoc({ selfID, reducer, selfIDProp, propTypes })(
      Target
    )
  );
};
