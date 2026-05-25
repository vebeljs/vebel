import {
  Vebel,
  For,
  Await,
  Portal,
  Link,
  Navigation,
  state,
  Fragment,
} from "./core/vebel";

import { Api } from "./core/api";

const { defineRoutes, getHash, getQueryParams, getRouterParams, getPathName } =
  Navigation;

const {
  setErrorBoundary,
  setEffect,
  navigate,
  renderApp,
  useElementRef,
  createStore,
  useGlobal,
  fromParent,
  list,
  load,
  preservedState,
  useRouteEffect,
  elements: Dom,
} = Vebel;

export {
  state,
  setEffect,
  defineRoutes,
  Dom,
  For,
  navigate,
  renderApp,
  useElementRef,
  getQueryParams,
  getRouterParams,
  getHash,
  getPathName,
  useGlobal,
  createStore,
  Portal,
  list,
  fromParent,
  Await,
  load,
  setErrorBoundary,
  preservedState,
  useRouteEffect,
  Link,
  Api,
};

function jsx(fn, props) {
  return Vebel.jsx(fn, props);
}

function jsxs(fn, props) {
  return Vebel.jsx(fn, props);
}

function jsxDEV(fn, props) {
  return Vebel.jsx(fn, props);
}

export { Fragment, jsx, jsxs, jsxDEV };

export default Vebel;
