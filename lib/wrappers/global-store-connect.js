import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connectAdvanced as reduxConnectAdvanced } from 'react-redux';
import { logError, omit, isFunction, reduce, each } from '../utils';
import { mountActionType, unmountActionType, reducerName, actionTypePrefix, getSelfIdByComponentName } from '../config';
import { assertFunction, assertPlainObject, assertRedundantProps } from '../assert';



const compose = (...funcs) => funcs.reduce((acc, func) => (...args) => acc(func(...args)), (arg) => arg);


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



const attachReducerAndSetSelfIDHOC = ({ displayName, reducer }) => (Target) => {
  const Cmp = class Cmp extends Component {
    componentDidMount () {
      const { $$selfID, $$selfMount } = this.props;

      if (!reducersMap.has($$selfID)) {
        reducersMap.set($$selfID, reducer);

        $$selfMount($$selfID);
      }
    }

    componentWillUnmount () {
      const { $$selfID, $$selfUnmount } = this.props;

      if (reducersMap.has($$selfID)) {
        $$selfUnmount($$selfID);
        reducersMap.delete($$selfID);
      }
    }

    UNSAFE_componentWillUpdate ({ $$selfID: next$$selfID }) {
      const { $$selfID, $$selfUnmount, $$selfMount } = this.props;

      if ($$selfID !== next$$selfID) {
        if (reducersMap.has($$selfID)) {
          $$selfUnmount($$selfID);
          reducersMap.delete($$selfID);
        }

        if (!reducersMap.has(next$$selfID)) {
          reducersMap.set(next$$selfID, reducer);
          $$selfMount(next$$selfID);
        }
      }
    }

    render () {
      const { $$selfMount, $$selfUnmount, $$selfID, $$selfCouldRender, ...props } = this.props;

      return ($$selfCouldRender ? <Target {...props} /> : <noscript />);
    }
  };

  Cmp.displayName = `Self(${displayName})`;

  Cmp.propTypes = {
    $$selfID: PropTypes.string,
    $$selfMount: PropTypes.func,
    $$selfCouldRender: PropTypes.bool,
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


const $$selfMount = (selfID) => ({
  type: mountActionType(),
  meta: { selfID },
  payload: null
});

const $$selfUnmount = (selfID) => ({
  type: unmountActionType(),
  meta: { selfID },
  payload: null
});


export default ({
  selfID,
  reducer,

  selectorFactory,

  // connect
  mapDispatchToProps = null,

  ...other
}) => (Target) => {
  assertRedundantProps('connect-to-global-store', other);


  let wrapMapDispatch = () => ({});

  if (mapDispatchToProps != null) {
    if (isFunction(mapDispatchToProps)) {
      throw new TypeError('mapDispatchToProps as function is not supported');
    } else {
      assertPlainObject('mapDispatchToProps', mapDispatchToProps);
      each(mapDispatchToProps, (actionCreator, name) => assertFunction(`mapDispatchToProps[${name}]`, actionCreator));

      wrapMapDispatch = (dispatch) => reduce(mapDispatchToProps, (map, actionCreator, name) => {
        if (!isFunction(actionCreator)) {
          throw new TypeError(`mapDispatchToProps[${name}] is not a function`);
        }

        map[name] = (...args) => dispatch(actionCreator(...args));

        return map;
      }, {});
    }
  }

  if (reducer !== null) {
    const $wrapMapDispatch = (dispatch) => ({
      $$selfMount: (...args) => dispatch($$selfMount(...args)),
      $$selfUnmount: (...args) => dispatch($$selfUnmount(...args))
    });

    let componentsCounter = 0;
    const baseNumber = ++selfComponentsCounter;
    const displayName = getSelfIdByComponentName() ? String(Target.displayName || Target.name || `C${(baseNumber)}`) : `C${(baseNumber)}`;

    return compose(
      reduxConnectAdvanced((dispatch, factoryOptions) => {
        const compSelfID = selfID || `${displayName}:${baseNumber}:${++componentsCounter}`;
        let prevProps = {};
        let prevResult = {};
        let prevSelfID = null;
        let prevCouldRender = false;
        let actionCreators = {};
        let sysActionCreators = {};
        const select = selectorFactory();
        const currentReducerName = reducerName();

        return (nextState, nextProps) => {
          const nextSelfID = nextProps.selfID || compSelfID;
          const couldRender = reducersMap.has(nextSelfID);

          let needRefresh = couldRender !== prevCouldRender;

          if (couldRender) {
            prevCouldRender = true;
            nextProps = select(nextState[currentReducerName][nextSelfID], nextState, nextProps);
            needRefresh = needRefresh || nextProps !== prevProps;
          } else {
            prevCouldRender = false;
            nextProps = prevProps;
            needRefresh = true;
          }

          if (prevSelfID !== nextSelfID) {
            prevSelfID = nextSelfID;
            needRefresh = true;

            const _dispatch = wrapDispatch(dispatch, nextSelfID);

            actionCreators = wrapMapDispatch(_dispatch);
            sysActionCreators = $wrapMapDispatch(_dispatch);
          }

          if (needRefresh) {
            prevProps = nextProps;
            prevResult = {
              ...nextProps,
              ...actionCreators,
              ...sysActionCreators,
              $$selfID: nextSelfID,
              $$selfCouldRender: couldRender
            };
          }

          return prevResult;
        };
      }),
      attachReducerAndSetSelfIDHOC({ displayName, reducer })
    )(Target);
  }

  return reduxConnectAdvanced((dispatch) => {
    const select = selectorFactory();
    let prevResult = {};
    let prevProps = {};

    const actions = wrapMapDispatch(dispatch);

    return (nextState, nextProps) => {
      nextProps = select(null, nextState, nextProps);

      if (nextProps !== prevProps) {
        prevProps = nextProps;

        prevResult = {
          ...nextProps,
          ...actions
        };
      }

      return prevResult;
    };
  })(Target);
};
