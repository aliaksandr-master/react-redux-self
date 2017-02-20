import { denormalize } from 'normalizr';
import { assertRegExp } from './assert';


let globalReducerName = '';
let globalActionTypePrefix = '';
let globalMountAction = '';
let globalUnMountAction = '';
let globalConnectionType = '';
let globalDenormalizeFunction = null;
let globalDenormalizeEntitiesGetter = null;


export const makeActionType = (action) => `${globalActionTypePrefix}${action}`;

export const actionsFactory = (componentName = '') => {
  assertRegExp(/^[a-zA-Z][a-zA-Z0-9$_]+$/, 'self name', componentName);

  return (actionName) => {
    assertRegExp(/^[a-zA-Z0-9$_]+$/, 'action name', actionName);

    return makeActionType(`${componentName}/${actionName}`);
  };
};

export const mountActionType = () => globalMountAction;

export const unmountActionType = () => globalUnMountAction;

export const actionTypePrefix = () => globalActionTypePrefix;

export const getDenormalizeEntitiesGetter = () => globalDenormalizeEntitiesGetter;

export const reducerName = () => globalReducerName;

export const getConnectionType = () => globalConnectionType;

export const getDenormalizeFunction = () => globalDenormalizeFunction;



export const configure = ({
  denormalizeEntitiesGetter = null,
  denormalizeFunction = null,
  connectionType = null,
  reducerName = null
}) => {
  if (denormalizeEntitiesGetter !== null) {
    globalDenormalizeEntitiesGetter = denormalizeEntitiesGetter;
  }

  if (connectionType !== null) {
    if (connectionType !== 'global') {
      throw new Error(`invalid connection type "${connectionType}"`);
    }
    globalConnectionType = connectionType;
  }

  if (denormalizeFunction !== null) {
    globalDenormalizeFunction = denormalizeFunction;
  }

  if (reducerName !== null) {
    globalReducerName = reducerName;
    globalActionTypePrefix = `@@${globalReducerName}:`;
    globalMountAction = makeActionType('COMPONENT_MOUNTING');
    globalUnMountAction = makeActionType('COMPONENT_UNMOUNTING');
  }
};



configure({
  denormalizeEntitiesGetter: (self, storeState) => storeState.entities,
  denormalizeFunction: denormalize,
  connectionType: 'global',
  reducerName: 'self'
});
