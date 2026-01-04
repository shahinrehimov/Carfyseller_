import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import { parse, stringify } from "jsurl2";
import { toast } from "sonner";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import "./assets/styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { ThemeProvider } from "./components/themes/provider.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { checkUserQueryOptions } from "./lib/queries/checkUser.ts";
import { polyfillToastConsole } from "./lib/utils/devConsoleToast.ts";
import { TranslationLoader } from "./lib/utils/translationLoader.ts";

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(import.meta.env.DEV ? console.info : undefined);
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_DEV_TOAST_ON_CONSOLE === "true"
) {
  window.addEventListener("error", (e) =>
    toast.error("Uncaught exception thrown:", { description: e.message }),
  );
  polyfillToastConsole();
}

const queryContext = TanstackQuery.getContext();

// prefetch userinfo as early as possible
queryContext.queryClient.prefetchQuery(checkUserQueryOptions);

// Load translations with version checking
TranslationLoader.loadTranslations();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    ...queryContext,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,

  defaultViewTransition: true,

  parseSearch: parseSearchWith(parse),
  stringifySearch: stringifySearchWith(stringify),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <TanstackQuery.Provider>
          <RouterProvider router={router} />
        </TanstackQuery.Provider>
      </ThemeProvider>
    </StrictMode>,
  );
}
