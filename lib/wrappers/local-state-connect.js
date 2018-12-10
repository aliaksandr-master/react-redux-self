import React, { Component } from 'react';
import { isFunction, reduce } from '../utils';
import { assertRedundantProps } from '../assert';


let globalCounter = 0;


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
  assertRedundantProps('local-state-connect', other);

  if (reducer === null || mapDispatchToProps === null) {
    return Target;
  }

  const Component = class extends Component {

    constructor (...args) {
      super(...args);

      this.state = reducer(undefined, { type: '@SELF_INIT', payload: {} });

      mapDispatchToProps = isFunction(mapDispatchToProps) ? mapDispatchToProps(this.dispatch.bind(this)) : mapDispatchToProps;

      this.actionTriggers = reduce(mapDispatchToProps, (actionTriggers, actionCreator, actionTriggerName) => ({
        ...actionTriggers,
        [actionTriggerName]: (...args) => this.dispatch(actionCreator(...args))
      }), {});

      this.selector = selectorFactory();
    }

    dispatch (action) {
      return new Promise((resolve) => {
        this.setState((state) => reducer(state, action), resolve); // eslint-disable-line react/no-set-state
      });
    }

    render () {
      return (
        <Target {...this.props} {...this.selector(this.state, null, this.props)} {...this.actionTriggers} />
      );
    }
  };

  Component.displayName = `SelfLocalState${globalCounter++}`;

  return Component;
};
