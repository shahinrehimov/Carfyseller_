import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/utils/translationLoader";
import Settings from "./-components/Settings";
import ChangePassword from "./-components/ChangePassword";

const profilePageSearchParamsSchema = z.object({
  tab: z.enum(["settings", "security"]).default("settings"),
});
type profilePageSearchParamsSchema = z.infer<
  typeof profilePageSearchParamsSchema
>;
export const Route = createFileRoute("/_app/profile/")({
  component: RouteComponent,
  validateSearch: zodValidator(profilePageSearchParamsSchema),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { tab = "settings" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const setTab = useCallback(
    (tab: string) =>
      navigate({
        search: { tab: tab as profilePageSearchParamsSchema["tab"] },
        replace: true,
        resetScroll: false,
      }),
    [navigate],
  );
  return (
    <div className="w-full">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
          <TabsTrigger value="security">{t("security")}</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <Settings />
        </TabsContent>
        <TabsContent value="security">
          <ChangePassword />
        </TabsContent>
      </Tabs>
    </div>
  );
}
