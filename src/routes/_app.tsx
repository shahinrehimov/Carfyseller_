import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  async loader({ context: { queryClient } }) {
    try {
      await queryClient.ensureQueryData(checkUserQueryOptions);
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.response?.status === 401) {
          throw redirect({
            to: "/auth/signin",
          });
        }
      }
    }
  },
  pendingComponent: () => (
    <div className="flex h-screen w-screen grow items-center justify-center">Loading...</div>
  ),
});

function RouteComponent() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
