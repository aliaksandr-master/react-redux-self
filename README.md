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

# Why do you need to use `react-redux-self`, Abilities:
- Independence of the local component state from the global state directly. You don't need to define one more global reducer, just attach it to component.
- Independence of the similar components and their state on one page by default works at once relating to `selfID``. (like [redux-form](http://redux-form.com))
- Using a [normalizr]((https://github.com/paularmstrong/normalizr)) helps to speed up components update when changing by default, the same concerns manual usage of reselect-factory. Reselect by default isn't convenient and it's often used for the components incorrectly causing uncontrolled memory leaks. This Library provides useful interface (shortcuts) for this operations.
- Removed opportunity of direct working with `mapStateToProps`, now it's possible only through `selector`/`getters` which speeds up the working and redrawing process. You don't care how many connects you have on the page. It also simplifies logic fragmentation and it's hierarchy
- Forces to write only the important stuff without all that secondary sh*t in the state in the reducers saving only what can't be calculated. Everything that can be calculated should be calculated in the selector
- It fix `redux` state lifecycle. After the component's death it's local reducer also dies (or reducerS, there can be plenty of them and it looks like state mixins of that component, sometimes it's convenient), the component state also dies. There's nothing left and `you shouldn't worry about the memory and store size`. The only part that stays is what is shown on the page.
- This approach divides the global reducers with the component reducers and let's think what should be common and what should be local from the beginning.
- And the most important reason is that you don't use 2 state types - setState and redux-reducers to have all the team operations on the project in the same flow. There will also be an option with setState with the same API for those who want to divide the state from the global store (it will speed up the working process), - in development
- if there's no need in the local store (reducer) you can do without it. API isn't changed in this case, if the reducer isn't transferred you work directly with the global store and the updates will work out in relation to it with the same API that's there if you're using the local store.

# Basic Usage

```javascript
// /index.js
import { render } from 'react-dom';
import { reducer } from 'react-redux-self';
import { combineReducers, Provider, createStore } from 'react-redux';
import MyComponent from './components/MyComponent';

const store = createStore(combineReducers({
  self: reducer
}));

render((
  <Provider store={store}>
    <MyComponent />
  </Provider>
));





// /components/MyComponent.jsx
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





// /components/MyComponent.store.js
import { actionsFactory } from 'react-redux-self';

const action = actionsFactory('MyComponent');

const CHANGE_NAME = action('CHANGE_NAME');

const changeNameAction = (newName) => ({ 
  type: CHANGE_NAME, 
  payload: { name: newName } 
});

export default (state = { name: 'John', email: 'example@example.com' }, action) => {
  if (action.type === CHANGE_NAME) {
    return {
      ...state,
      name: action.payload.name
    };
  }
  return state;
};





// /components/MyComponent.container.js
import { compose, withHandlers } from 'recompose';
import MyComponent from './MyComponent.jsx';
import { globalStoreConnect } from 'react-redux-self';
import reducer, { changeNameAction } from './MyComponent.store.js'
import { calcGravatarByEmail } from 'lib/gravatar';

export default compose(
  globalStoreConnect({
    reducer,
    mapDispatchToProps: { changeNameAction },
    getters: [
      (ownStore, globalStore, props) => ownStore 
    ],
    selector: (ownStore) => ({
      ...ownStore,
      gravatar: calcGravatarByEmail(ownStore.email) // it should be calculated. do not store it OR do not calc it in render function 
    })
  }),
  withHandlers({
    handleChangeName: ({ changeNameAction }) => () => {
      changeNameAction('Silvia');
    }
  })
)(MyComponent);
```


## API

### globalStoreConnect(options)

Connect is wrapper of "native" `react-redux` connect. 

It provides `selector` and `denormalize` helpers to improve development experience.
  
It provides the component's reducer. 
It can store data inside and you can use this component several times on the page and this data will not be crossing (there is full isolation between the components).

### localStateConnect(options)

The same as `globalStoreConnect` but it use local state storage (emulated "redux on component" approach). Has no connection to redux itself

#### options.selfID 
type `String`. Default `null`

Basic selfID of the component. 
You can change it if you specify the prop selfID deliberately on the component like `<MyComponent selfID="some">` it can help you find it to control remotely by `action creators`. 

#### options.getters[(ownStore, globalStore, ownProps) => ?]
type `[Function]`. Default `null`

it is a shortcut for getters of selector. read more about [reselect](https://github.com/reactjs/reselect)


#### options.selector(...gettersResults)
type `Function`. Default `null`.
  
It is a shortcut for `createSelector` factory. read more about it [here](https://github.com/reactjs/reselect)

It receives all arguments as results of `getters` functions


```javascript
connect({
  getters: [
    (ownStore, globalStore, ownProps) => ownStore 
  ],
  selector: (ownStore) => ownStore
})
```

#### options.reducer(state, action)
type `Function` or `[Function]`. Default `null` 

It creates it's own store in this component.

if reducer !== `null` and selector === `null` and getters === `null`. Selector and getter will be pointing to it's own store first.

#### options.denormalize = { propName: scheme }
type `Object`. Default `null`

It is a simple shortcut for map denormalization that provides by `normalizr`. read more about [normalizr](https://github.com/paularmstrong/normalizr)

 ```javascript
const someEntityScheme = new Entity('some');
const someArrayItemScheme = new Entity('someArrayItem');

connect({
  denormalie: {
    pathToProp: someEntityScheme,
    pathToAnotherProp: [ someArrayItemScheme ]
  }
})
```

##### options.denoralizeFunction(value, schema, entities)
type `Function` default `denormalize` (from configuration)

##### options.denormalizeEntitiesGetter(ownStore, globalStore, ownProps)
type `Function` default `(_1, { entities }) => entities` (from configuration)


##### options.mapDispatchToProps - (redux connect)
type `Object` default `null`

> this property only for `global` connectionType

##### options.mergeProps - (redux connect)
> this property only for `global` connectionType
  
#### options.connectOptions - (redux connect options)
> this property only for `global` connectionType

### configure(settings)
You can change global settings of this wrapper

#### settings.denormalizeEntitiesGetter
Default: (self, storeState) => storeState.entities

#### settings.denormalizeFunction
`Function` Default: denormalize

#### settings.reducerName = null
`String` Default: 'self'

#### settings.selfIdByComponentName = null
`Boolean` Default: 'false'


### actionsFactory(ComponentName) => (ActionName) => computed name
- simple shortcut for using optimizations in self store.

this approach allows to use any action name you want without fear about of aciton-name collisions

```javascript
import { actionsFactory } from 'react-redux-self';

const action = actionsFactory('MyComponent');

const SOME_ACTION = action('SOME_ACTION');
```

### reducer
- global reducer to connect "self" store into your actual global store 

```javascript
import { reducer as selfReducer } from 'react-redux-self';
import { combineReducers, Provider, createStore } from 'react-redux';

const store = createStore(combineReducers({
  self: selfReducer
}));
```

