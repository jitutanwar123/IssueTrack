function compilePath(path) {
  const keys = [];
  const pattern = path
    .replaceAll(/\/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return "/([^/]+)";
    })
    .replaceAll(/\//g, "\\/");
  const regex = new RegExp(`^${pattern}$`);
  return { regex, keys };
}

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler) {
    const { regex, keys } = compilePath(path);
    this.routes.push({ method, path, handler, regex, keys });
  }

  get(path, handler) {
    this.register("GET", path, handler);
  }

  post(path, handler) {
    this.register("POST", path, handler);
  }

  put(path, handler) {
    this.register("PUT", path, handler);
  }

  delete(path, handler) {
    this.register("DELETE", path, handler);
  }

  match(method, pathname) {
    return this.routes.find((route) => route.method === method && route.regex.test(pathname));
  }
}

export function createRouter() {
  return new Router();
}

export function matchParams(route, pathname) {
  const match = pathname.match(route.regex);
  if (!match) return {};
  return route.keys.reduce((acc, key, index) => {
    acc[key] = decodeURIComponent(match[index + 1]);
    return acc;
  }, {});
}
