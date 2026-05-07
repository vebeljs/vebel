import { VebelError } from "./error.js";
import {
  Route,
  RouteConfig,
  Vebeljs,
  RootLayoutConfig,
  RouteChildren,
} from "./types.js";

class VebelNavigation {
  #routerParams: { [key: string]: string } = {};
  #routes: { [path: string]: Route } = {};

  #layoutId = 1;

  #layouts: {
    [id: string]: RootLayoutConfig;
  } = {};

  public getRootLayout(layoutId: number) {
    return this.#layouts[layoutId];
  }

  #activeLayout: {
    [lid: number]: { range: Range; blockId: string; layoutBlockId: string };
  } = null;

  public getActiveLayout(lid: number) {
    return this.#activeLayout ? this.#activeLayout[lid] : null;
  }

  public setActiveLayout(
    layoutId: number,
    config: { range: Range; blockId: string; layoutBlockId: string },
  ) {
    this.#activeLayout[layoutId] = config;
  }

  public resetActiveLayout(data: any) {
    if (data === "init") {
      this.#activeLayout = {};
      return;
    }

    this.#activeLayout = data;
  }

  get hasActiveLayout() {
    return !!this.#activeLayout;
  }

  // public currentLayout: number | number[];

  #NotFoundPage: Route;

  #routeRegexCache: {
    [path: string]: {
      regex: RegExp;
      paramNames: string[];
    };
  } = {};

  constructor() {}

  public getRouterParams = () => {
    return this.#routerParams;
  };

  public resetRouterParams() {
    this.#routerParams = {};
  }

  public getQueryParams = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    return params;
  };

  public getHash = () => {
    return window.location.hash.slice(1);
  };

  public getPathName = () => {
    return window.location.pathname;
  };

  #normalizePath(path: string) {
    if (path === "/") return "/";
    return path.replace(/\/+$/, ""); // remove all trailing slashes
  }

  #validateRoute(path: string, route: Vebeljs.Route) {
    const hasComponent = "component" in route && route.component !== undefined;
    const hasLayout = "layout" in route && route.layout !== undefined;
    const hasChildren = "children" in route && route.children !== undefined;
    const hasConfig = "config" in route && route.config !== undefined;

    // ── Must have at least one discriminant ───────────────────────────────
    if (!hasComponent && !hasLayout) {
      throw new VebelError(
        `[Vebel.NavigationError]: In defineRoute, '${path}':  Must have either "component" (leaf route) or "layout" (layout route).`,
      );
    }

    // ── Cannot mix both discriminants ─────────────────────────────────────
    if (hasComponent && hasLayout) {
      throw new VebelError(
        `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
          '"component" and "layout" cannot both be defined. ' +
          'Use "component" for a leaf route or "layout" for a layout route, not both.',
      );
    }

    // ── Leaf route branch ─────────────────────────────────────────────────
    if (hasComponent) {
      if (typeof route.component !== "function") {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"component" must be a function/component.',
        );
      }
      if (hasLayout) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"layout" is not allowed on a leaf route. Remove "layout", or remove "component" and add "children" to make it a layout route.',
        );
      }
      if (hasChildren) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"children" is not allowed on a leaf route. ' +
            'To nest routes, remove "component" and use "layout" + "children" instead.',
        );
      }
      return { leaf: route as Vebeljs.LeafRoute };
    }

    // ── Layout route branch ───────────────────────────────────────────────
    if (hasLayout) {
      if (typeof route.layout !== "function") {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"layout" must be a function/component.',
        );
      }
      if (!hasChildren) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"children" is required when "layout" is defined. ' +
            'Add a "children" object with at least one nested route.',
        );
      }
      if (typeof route.children !== "object" || Array.isArray(route.children)) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"children" must be a plain object (RouteMap).',
        );
      }
      if (Object.keys(route.children as object).length === 0) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"children" cannot be empty. Add at least one nested route, ' +
            'or remove "layout" and use "component" instead.',
        );
      }
      if (hasConfig) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"config" is not allowed on a layout route. ' +
            'Move "config" into individual child routes that have a "component".',
        );
      }
      if (hasComponent) {
        throw new VebelError(
          `[Vebel.NavigationError]: In defineRoute, '${path}': ` +
            '"component" is not allowed on a layout route. ' +
            'Use "layout" for the wrapping shell and put page components inside "children".',
        );
      }

      return { layout: route as Vebeljs.LayoutRoute };
    }

    // Should never reach here given the checks above
    throw new VebelError(
      `[Vebel.NavigationError]: In defineRoute, '${path}'. Please provide valid route config.`,
    );
  }

  #checkRouteLayout(
    path: string,
    route: Vebeljs.Route | (() => Vebeljs.Element),
    parentLayoutId?: number | number[],
  ) {
    if (typeof route === "function") {
      this.#buildRouteRegex(path);

      this.#routes[path] = {
        component: route,
        ...(this.#isLayoutExist(parentLayoutId) ? { lid: parentLayoutId } : {}),
      };

      return;
    }

    const vRoute = this.#validateRoute(path, route);

    if (vRoute.layout) {
      this.#configureLayout(path, vRoute.layout, parentLayoutId);
    }

    if (vRoute.leaf) {
      this.#buildRouteRegex(path);

      this.#routes[path] = {
        ...route,
        component: route.component,
        ...(this.#isLayoutExist(parentLayoutId) ? { lid: parentLayoutId } : {}),
      };
    }
  }

  #buildRouteRegex(path: string) {
    const paramNames: string[] = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, key) => {
      paramNames.push(key);
      return "([^/]+)";
    });
    this.#routeRegexCache[path] = {
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
    };
  }

  #configureRoute(
    path: string,
    route: Vebeljs.Route | (() => Vebeljs.Element),
  ) {
    path = this.#normalizePath(path);

    if (!path.startsWith("/")) {
      throw new VebelError("Route path must start with '/'");
    }

    const rootLayout = this.#layouts[0];

    this.#checkRouteLayout(path, route, rootLayout?.layout ? 0 : null);
  }

  public defineRoutes = (
    children: RouteChildren,
    globalConfig?: RouteConfig,
  ) => {
    if (Object.keys(this.#routes).length > 0) {
      throw new VebelError(
        `[Vebel.Navigation]: Routes has been already defined. Can't create new instance. Modify existing.`,
      );
    }

    if (!children) {
      throw new VebelError(
        `[Vebel.Navigation]: 'children' argument missing from routes or provide appropriate value`,
      );
    }

    if (
      globalConfig &&
      (globalConfig.middleware || globalConfig.layout || globalConfig.loader)
    ) {
      this.#layouts[0] = {
        middleware: globalConfig.middleware,
        layout: globalConfig.layout,
        loader: globalConfig.loader,
      };
    }

    Object.entries(children).forEach(([path, route]) => {
      if (path === "*") {
        if (typeof route === "function") {
          this.#NotFoundPage = {
            component: route,
            config: {},
          };
        } else {
          if (!route?.component)
            throw new VebelError(
              "Component Not provided for wildcard route '*'",
            );
          this.#NotFoundPage = {
            component: route.component,
            config: route?.config,
          };
        }
      } else {
        this.#configureRoute(path, route);
      }
    });
  };

  #isLayoutExist(id: number | number[]) {
    return id !== null && id !== undefined;
  }

  #configureLayout(
    path: string,
    route: Vebeljs.LayoutRoute,
    parentLayoutId?: number | number[],
  ) {
    const id = this.#layoutId++;
    let lid: number | number[];

    if (this.#isLayoutExist(parentLayoutId)) {
      if (typeof parentLayoutId === "number") {
        lid = [id, parentLayoutId];
      } else {
        lid = [id, ...parentLayoutId];
      }
    } else {
      lid = id;
    }

    Object.entries(route?.children).forEach(([pathKey, routeValue]) => {
      const newPath = this.#normalizePath(
        path === "/" ? pathKey : path + pathKey,
      );

      this.#checkRouteLayout(newPath, routeValue, lid);
    });

    this.#layouts[id] = {
      ...(route?.layout && { layout: route.layout }),
      ...(route?.middleware && { middleware: route.middleware }),
      ...(route?.loader && { loader: route.loader }),
    };
  }

  public resolveRoute(initialPath: string) {
    const path = this.#normalizePath(initialPath ?? window.location.pathname);

    let route = this.#routes[path];

    for (const extPath in this.#routes) {
      const { regex, paramNames } = this.#routeRegexCache[extPath];
      const match = path.match(regex);
      if (match) {
        paramNames.forEach((name, i) => {
          this.#routerParams[name] = match[i + 1];
        });
        route = this.#routes[extPath];
        break;
      }
    }

    if (!route) {
      if (this.#NotFoundPage)
        return {
          route: this.#NotFoundPage,
          globalRoute: {},
          layoutRoute: {},
          path: null,
        };
      throw new VebelError(`INVALID ROUTE: '${path}' route is not define.`);
    }

    const globalRoute = this.#layouts[0] || {};
    const isLayoutExist = this.#isLayoutExist(route.lid);
    let crrLid: number = null;
    if (isLayoutExist) {
      if (typeof route.lid === "number") {
        crrLid = route.lid;
      } else {
        crrLid = route.lid[0];
      }
    }

    const layoutRoute = isLayoutExist ? this.#layouts[crrLid] : {};

    return { route, globalRoute, layoutRoute, path };
  }
}

const Navigation = new VebelNavigation();
export { Navigation, VebelNavigation };
