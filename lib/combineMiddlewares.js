import { compose } from 'redux';



export default (...middlewares) => (storeAPI) =>
  compose(...middlewares.map((middleware) => middleware(storeAPI)));
