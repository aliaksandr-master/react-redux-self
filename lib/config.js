import { denormalize } from 'normalizr';
import { assertRegExp } from './assert';


let globalReducerName = '';
let globalActionTypePrefix = '';
let globalMountAction = '';
let globalUnMountAction = '';
let globalEntitiesReducerName = '';
let globalSelfIDProp = '';
let globalConnectionType = '';
let globalDenormalizeFunction = null;


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

export const entitiesReducerName = () => globalEntitiesReducerName;

export const reducerName = () => globalReducerName;

export const getSelfIDProp = () => globalSelfIDProp;

export const getConnectionType = () => globalConnectionType;

export const getDenormalizeFunction = () => globalDenormalizeFunction;



export const configure = ({
  entitiesReducerName = null,
  denormalizeFunction = null,
  connectionType = null,
  reducerName = null,
  selfIDProp = null
}) => {
  if (entitiesReducerName !== null) {
    globalEntitiesReducerName = entitiesReducerName;
  }

  if (connectionType !== null) {
    if (connectionType !== 'global') {
      throw new Error(`invalid connection type "${connectionType}"`);
    }
    globalConnectionType = connectionType;
  }

  if (selfIDProp !== null) {
    assertRegExp(/^[a-zA-Z][a-zA-Z0-9$_]+$/, 'self ID prop name', selfIDProp);
    globalSelfIDProp = selfIDProp;
  }

  if (denormalizeFunction !== null) {
    globalDenormalizeFunction = denormalizeFunction;
  }

  if (reducerName !== null) {
    globalReducerName = reducerName;
    globalActionTypePrefix = `@@${globalReducerName}:`;
    globalMountAction = makeActionType('MOUNT_COMPONENT');
    globalUnMountAction = makeActionType('UNMOUNT_COMPONENT');
  }
};



configure({
  denormalizeFunction: denormalize,
  connectionType: 'global',
  entitiesReducerName: 'entities',
  reducerName: 'self',
  selfIDProp: 'selfID'
});
