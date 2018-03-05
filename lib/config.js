import { denormalize } from 'normalizr';
import { assertRegExp } from './assert';


let globalReducerName = '';
let globalActionTypePrefix = '';
let globalMountAction = '';
let globalUnMountAction = '';
let globalDenormalizeFunction = null;
let globalDenormalizeEntitiesGetter = null;
let globalSelfIdByComponentName = false;


export const makeActionType = (action) => `${globalActionTypePrefix}${action}`;

const factories = {};

export const actionsFactory = (componentName = '') => {
  assertRegExp(/^[a-zA-Z][a-zA-Z0-9$_]+$/, 'self name', componentName);

  if (factories.hasOwnProperty(componentName)) {
    throw new ReferenceError(`actionsTypeFactory has already defined for component "${componentName}"`);
  }

  factories[componentName] = true;

  const actions = {};

  return (actionName) => {
    assertRegExp(/^[a-zA-Z0-9$_]+$/, 'action name', actionName);

    if (actions.hasOwnProperty(actionName)) {
      throw new ReferenceError(`actionType has already defined for actionsTypeFactory "${componentName}"`);
    }

    actions[actionName] = true;

    return makeActionType(`${componentName}/${actionName}`);
  };
};

export const mountActionType = () => globalMountAction;

export const unmountActionType = () => globalUnMountAction;

export const actionTypePrefix = () => globalActionTypePrefix;

export const getDenormalizeEntitiesGetter = () => globalDenormalizeEntitiesGetter;

export const reducerName = () => globalReducerName;

export const getDenormalizeFunction = () => globalDenormalizeFunction;

export const getSelfIdByComponentName = () => globalSelfIdByComponentName;



export const configure = ({
  denormalizeEntitiesGetter = null,
  selfIdByComponentName = null,
  denormalizeFunction = null,
  reducerName = null
}) => {
  if (denormalizeEntitiesGetter !== null) {
    globalDenormalizeEntitiesGetter = denormalizeEntitiesGetter;
  }

  if (denormalizeFunction !== null) {
    globalDenormalizeFunction = denormalizeFunction;
  }

  if (selfIdByComponentName !== null) {
    globalSelfIdByComponentName = Boolean(selfIdByComponentName);
  }

  if (reducerName !== null) {
    globalReducerName = reducerName;
    globalActionTypePrefix = `@@${globalReducerName}:`;
    globalMountAction = makeActionType('COMPONENT_MOUNTING');
    globalUnMountAction = makeActionType('COMPONENT_UNMOUNTING');
  }
};



configure({
  selfIdByComponentName: false,
  denormalizeEntitiesGetter: (self, storeState) => storeState.entities,
  denormalizeFunction: denormalize,
  reducerName: 'self'
});
