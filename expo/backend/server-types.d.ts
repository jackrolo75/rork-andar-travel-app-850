declare module 'hono' {
  export class Hono<E = any> {
    use(...args: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    patch(path: string, ...handlers: any[]): this;
    all(path: string, ...handlers: any[]): this;
    route(path: string, app: Hono): this;
    fetch(request: Request): Promise<Response>;
  }
  export type Context<E = any> = {
    req: {
      raw: Request;
      url: string;
      method: string;
      param: (name: string) => string;
      query: (name: string) => string | undefined;
      json: <T = any>() => Promise<T>;
      text: () => Promise<string>;
      header: (name: string) => string | undefined;
    };
    json: (data: any, status?: number) => Response;
    text: (data: string, status?: number) => Response;
    html: (data: string, status?: number) => Response;
    redirect: (url: string, status?: number) => Response;
    status: (code: number) => Context<E>;
    header: (name: string, value: string) => void;
    set: (key: string, value: any) => void;
    get: (key: string) => any;
    env: E;
  };
  export type Next = () => Promise<void>;
  export type MiddlewareHandler = (c: Context, next: Next) => Promise<void | Response>;
}

declare module 'hono/cors' {
  import { MiddlewareHandler } from 'hono';
  export function cors(options?: {
    origin?: string | string[] | ((origin: string) => string | undefined | null);
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
  }): MiddlewareHandler;
}

declare module 'hono/compress' {
  import { MiddlewareHandler } from 'hono';
  export function compress(): MiddlewareHandler;
}

declare module '@hono/trpc-server' {
  import { Hono } from 'hono';
  export function trpcServer(options: { router: any; createContext?: any }): any;
}

declare module 'socket.io' {
  export class Server {
    constructor(httpServer?: any, options?: any);
    on(event: string, callback: (socket: Socket) => void): this;
    emit(event: string, ...args: any[]): boolean;
    to(room: string): this;
    in(room: string): this;
  }
  export interface Socket {
    id: string;
    handshake: {
      query: Record<string, string>;
      headers: Record<string, string>;
    };
    on(event: string, callback: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
    join(room: string): void;
    leave(room: string): void;
    to(room: string): this;
    disconnect(close?: boolean): this;
  }
}

declare module 'ioredis' {
  class Redis {
    constructor(url?: string);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: any[]): Promise<string>;
    del(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpush(key: string, ...values: string[]): Promise<number>;
    lpop(key: string): Promise<string | null>;
    rpop(key: string): Promise<string | null>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<number>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): this;
    quit(): Promise<string>;
    disconnect(): void;
  }
  export default Redis;
}

declare module 'rate-limiter-flexible' {
  export class RateLimiterRedis {
    constructor(options: {
      storeClient: any;
      keyPrefix?: string;
      points: number;
      duration: number;
      blockDuration?: number;
    });
    consume(key: string, points?: number): Promise<RateLimiterRes>;
    get(key: string): Promise<RateLimiterRes | null>;
    delete(key: string): Promise<boolean>;
    block(key: string, secDuration: number): Promise<RateLimiterRes>;
  }
  export class RateLimiterMemory {
    constructor(options: {
      keyPrefix?: string;
      points: number;
      duration: number;
      blockDuration?: number;
    });
    consume(key: string, points?: number): Promise<RateLimiterRes>;
    get(key: string): Promise<RateLimiterRes | null>;
    delete(key: string): Promise<boolean>;
    block(key: string, secDuration: number): Promise<RateLimiterRes>;
  }
  export interface RateLimiterRes {
    remainingPoints: number;
    msBeforeNext: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
  }
}
