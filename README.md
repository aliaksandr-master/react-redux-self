[![npm](http://img.shields.io/npm/v/react-redux-self.svg?style=flat-square)](https://www.npmjs.com/package/react-redux-self)
[![npm](http://img.shields.io/npm/l/react-redux-self.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/aliaksandr-master/react-redux-self.svg?style=flat-square)](https://david-dm.org/aliaksandr-master/react-redux-self)
[![devDependency Status](https://david-dm.org/aliaksandr-master/react-redux-self/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-master/react-redux-self#info=devDependencies)
[![peerDependency Status](https://david-dm.org/aliaksandr-master/react-redux-self/peer-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-master/react-redux-self?type=peer)

# react-redux-self

```shell
$ npm install react react-redux redux reselect normalizr
$ npm install react-redux-self --save
```


# Basic Usage

```javascript
// /MyComponent.jsx
import React, { PropTypes } from 'react';

const MyComponent = ({ name, handleChange }) => (
  <div>
    <h1>Hello! {name}</h1>
    <button type="button" onClick={handleChangeName}>Change My Name To Silvia!</button>
  </div>
);

MyComponent.propTypes = {
  name: PropTypes.string.isRequired,
  handleChangeName: PropTypes.func.isRequired
};

export default MyComponent;



// /MyComponent.store.js
import { actionsFactory } from 'react-redux-self';

const action = actionsFactory('MyComponent');

const CHANGE_NAME = action('CHANGE_NAME');

const changeNameAction = (newName) => ({ 
  type: CHANGE_NAME, 
  payload: { name: newName } 
});

export default (state = { name: 'John' }, action) => {
  if (action.type === CHANGE_NAME) {
    return {
      ...state,
      name: action.payload.name
    };
  }
  return state;
};




// /MyComponent.container.js
import { compose, withHandlers } from 'recompose';
import MyComponent from './MyComponent.jsx';
import { connect } from 'react-redux-self';
import reducer, { changeNameAction } from './MyComponent.store.js'

export default compose(
  connect({
    reducer,
    mapDispatchToProps: { changeNameAction }
  }),
  withHandlers({
    handleChangeName: ({ changeNameAction }) => () => {
      changeNameAction('Silvia');
    }
  })
)(MyComponent);

```
