import { objectMap, deferred } from "@dhmk/utils";

const GEN_CTX = {
  current: undefined as any,
};

export function run(gen: () => Generator) {
  const ctx = {
    next: (x) => {
      const prevCtx = GEN_CTX.current;
      GEN_CTX.current = ctx;

      try {
        g.next(x);
      } finally {
        GEN_CTX.current = prevCtx;
      }
    },

    // throw,
    // return,
  };

  const g = gen();
  return ctx.next;
}

export function* skip(n: number, cb?: (n: number) => void) {
  while (n--) {
    cb?.(n);
    yield;
  }
}

export function* output<T>(g: Generator, value: T) {
  yield* g;
  return value;
}

export function chain(fn: () => Promise<any>) {
  const p = deferred();
  let c = { isCancelled: false };
  let done;

  return {
    then: p.then.bind(p),

    next() {
      if (done) return { done, value: undefined };

      c.isCancelled = true;
      const cc = (c = { isCancelled: false });

      fn().then((x) => {
        if (cc.isCancelled) return;

        done = true;
        p.resolve(x);
      });

      return { done, value: undefined };
    },

    [Symbol.iterator]() {
      return this;
    },
  };
}

type RaceResult<T> = {
  [P in keyof T]:
    | undefined
    | (T[P] extends Generator<any, infer R>
        ? R
        : T[P] extends PromiseLike<infer R>
        ? R
        : T[P]);
};

export function race<T extends object>(conf: T): Generator<any, RaceResult<T>> {
  const ctx = GEN_CTX.current;
  const res = objectMap(conf, () => undefined);
  let done;

  for (const k in conf) {
    const a: any = conf[k];

    if (typeof a.then === "function") {
      a.then((x) => {
        if (done) return;

        res[k] = x;
        done = true;
        ctx.next();
      });
    }
  }

  return {
    next() {
      if (done) return { done, value: res };

      for (const k in conf) {
        const a: any = conf[k];

        if (typeof a.next === "function") {
          const { value, done: _done } = a.next();

          if (_done) {
            done = true;
            res[k] = value;
            break;
          }
        }
      }

      if (done) {
        // todo: finish all gens
      }

      return { done, value: res };
    },

    [Symbol.iterator]() {
      return this;
    },
  } as any;
}
