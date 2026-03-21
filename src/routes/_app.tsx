import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  async loader({ context: { queryClient } }) {
    try {
      const user = await queryClient.ensureQueryData(checkUserQueryOptions);
      if (user?.password_must_change) {
        throw redirect({ to: "/change-password" });
      }
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.response?.status === 401) {
          throw redirect({
            to: "/auth/signin",
          });
        }
      } else {
        throw e;
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
