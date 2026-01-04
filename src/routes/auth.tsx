import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";
import { isAxiosError } from "axios";
import { useTheme } from "@/components/themes/provider";

const authLayoutSearchSchema = z.object({
  redirect: z.string().optional(),
});
export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(authLayoutSearchSchema),
  loaderDeps: ({ search: { redirect: redirectPath } }) => ({
    redirectPath,
  }),
  async loader({ context: { queryClient }, deps: { redirectPath } }) {
    try {
      const data = await queryClient.ensureQueryData(checkUserQueryOptions);
      if (data) throw redirect({ to: redirectPath ?? "/" });
    } catch (e) {
      if (!isAxiosError(e)) {
        throw e;
      }
    }
  },
  pendingComponent: () => (
    <div className="flex h-screen w-screen grow items-center justify-center">
      Loading...
    </div>
  ),
  component: AuthLayout,
});

function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`h-screen w-full ${isDark ? "bg-[#1D1D1D]" : "bg-gray-50"}`}
    >
      <Outlet />
    </div>
  );
}
