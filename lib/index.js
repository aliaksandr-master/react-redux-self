import connect from './connect';
import combineMiddlewares from './combineMiddlewares';
import { configure, actionsFactory } from './config';
import wrapperGlobalStore, { reducer } from './wrappers/global-store-connect.js';
import wrapperLocalState from './wrappers/local-state-connect.js';


export const globalStoreConnect = connect(wrapperGlobalStore);
export const localStateConnect = connect(wrapperLocalState);


export {
  reducer,
  configure,
  actionsFactory,
  combineMiddlewares
};
