import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import TanstackQueryLayout from "../integrations/tanstack-query/layout";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { CompanyNotVerifiedModal } from "@/components/ui/company-not-verified-modal";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
      <Toaster />
      <CompanyNotVerifiedModal />
      <TanstackQueryLayout />
    </>
  ),
});
