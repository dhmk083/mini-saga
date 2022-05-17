import { deferred, signal, sleep } from "@dhmk/utils";
import { run, skip, output, chain, race } from "./";

jest.useFakeTimers();

test("basic", async () => {
  const sig = signal();
  const spy = jest.fn((n) => console.log(n + 1, "more..."));
  const result = jest.fn();
  let p = deferred();

  sig.subscribe(
    run(function* () {
      while (true) {
        const { ok } = yield* race({
          ok: output(skip(2, spy), true),
          timeout: chain(() => sleep(1000)),
        });

        if (ok) console.log("BINGO!");
        else console.log("Game Over!");

        result(ok);
        p.resolve();
        p = deferred();

        yield;
      }
    })
  );

  const p1 = p;
  sig();
  sig();
  jest.advanceTimersByTime(2000);
  await p1;
  expect(spy).toBeCalledTimes(2);
  expect(result).toBeCalledWith(undefined);

  spy.mockReset();
  result.mockReset();

  const p2 = p;
  sig();
  jest.advanceTimersByTime(900);
  sig();
  jest.advanceTimersByTime(900);
  sig();
  jest.advanceTimersByTime(900);
  await p2;
  expect(spy).toBeCalledTimes(2);
  expect(result).toBeCalledWith(true);
});
