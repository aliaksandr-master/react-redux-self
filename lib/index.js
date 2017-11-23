import { connect } from './connect';
import { reducer } from './wrappers/global-store-connect';
import combineMiddlewares from './combineMiddlewares';
import { configure, actionsFactory } from './config';


export { connect, reducer, configure, actionsFactory, combineMiddlewares };
