# mini-saga

Reimplemented [redux-saga](https://github.com/redux-saga/redux-saga) patterns.

## Example

```js
// Catch 3 events each within 1sec window or abort sequence.

event.subscribe(
  // create event handler
  run(function* () {
    while (true) {
      // wait and take 1st completed
      const { ok } = yield* race({
        // skip 2 events and return `true`...
        ok: output(
          skip(2, (n) => console.log(n + 1, "more...")),
          true
        ),
        // ...or return after 1sec (restarts for every new event)
        timeout: chain(() => sleep(1000)),
      });

      if (ok) console.log("BINGO!");
      else console.log("Game Over!");

      // await next sequence
      yield;
    }
  })
);

event(1);
// 2 more...
event(2);
// 1 more...
event(3);
// BINGO!

event(4);
// 2 more...
event(5);
// 1 more...
// <...>
// Game Over!
```
