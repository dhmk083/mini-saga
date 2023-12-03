import { deferred, signal, sleep } from "@dhmk/utils";

function eventToPromise(event) {
  let p = deferred();
  const dispose = event.subscribe((x) => {
    p.resolve(x);
    p = deferred();
  });

  return {
    next: () => p,
    dispose,
  };
}

async function skip(evp, n, fn) {
  let r;

  while (n--) {
    r = await evp.next();
    fn(n);
  }

  return r;
}

async function demo(event) {
  const evp = eventToPromise(event);

  while (true) {
    let done;
    const x = await Promise.race([
      skip(evp, 3, (n) => !done && n && console.log(n, "more...")),
      evp
        .next()
        .then(() => sleep(1000))
        .then(() => "timeout"),
    ]);
    done = true;

    if (x === "timeout") console.log("Game Over!");
    else console.log("BINGO!");
  }
}

const sig = signal();
demo(sig);
