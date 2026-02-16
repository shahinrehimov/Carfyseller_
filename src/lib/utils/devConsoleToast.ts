import { toast } from "sonner";

const consoleToToastMap = {
  log: "message",
  error: "error",
  warn: "warning",
  info: "info",
  debug: "info",
} as const satisfies Partial<Record<keyof typeof console, keyof typeof toast>>;

export function polyfillToastConsole() {
  if (!import.meta.env.DEV) {
    throw new Error("This should only be done in dev");
  }
  Object.entries(consoleToToastMap).forEach((entries) => {
    const [consoleKey, toastKey] = entries as [
      keyof typeof consoleToToastMap,
      (typeof consoleToToastMap)[keyof typeof consoleToToastMap],
    ];
    const originalFunction = console[consoleKey];
    const newFunction = function (...data: Array<any>) {
      data.forEach((e) =>
        toast[toastKey](`console.${consoleKey} logged:`, {
          description: JSON.stringify(e).substring(0, 50) + "...",
        }),
      );
      // @ts-expect-error the type of `this` nor `arguments` doesn't matter to us
      originalFunction.apply(this, arguments);
    };
    Object.defineProperty(newFunction, "name", {
      value: originalFunction.name,
    });
    for (const prop in originalFunction) {
      if (originalFunction.hasOwnProperty(prop)) {
        // @ts-expect-error we're setting properties typescript might not be aware of
        newFunction[prop] = originalFunction[prop];
      }
    }

    console[consoleKey] = newFunction;
  });
}
