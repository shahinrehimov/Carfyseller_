import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Monitor } from "lucide-react";

import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/index";

const SESSIONS_QUERY_KEY = ["profile-sessions-load"] as const;

interface SessionRow {
  id: number;
  device_name: string;
  ip_address: string | null;
  location: string | null;
  created_at: string;
  is_current: boolean;
}

interface SessionsLoadData {
  current_session: SessionRow | null;
  other_sessions: SessionRow[];
}

function normalizeSessionsLoadPayload(raw: unknown): SessionsLoadData {
  if (!raw || typeof raw !== "object") {
    return { current_session: null, other_sessions: [] };
  }
  const root = raw as Record<string, unknown>;
  const inner =
    root.data !== undefined &&
    root.data !== null &&
    typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const current = inner.current_session;
  const others = inner.other_sessions;
  return {
    current_session:
      current !== null && typeof current === "object"
        ? (current as SessionRow)
        : null,
    other_sessions: Array.isArray(others) ? (others as SessionRow[]) : [],
  };
}

function SessionCard({
  session,
  onLogout,
  isLoggingOut,
  showLogout,
}: {
  session: SessionRow;
  onLogout: (id: number) => void;
  isLoggingOut: boolean;
  showLogout: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between",
        session.is_current && "border-primary/50 bg-muted/30",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          <Monitor className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{session.device_name}</p>
            {session.is_current && (
              <Badge variant="success">{t("current_device")}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("ip_address")}:{" "}
            </span>
            {session.ip_address ?? "—"}
          </p>
          {session.location != null && session.location !== "" && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {t("location")}:{" "}
              </span>
              {session.location}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("signed_in_at")}:{" "}
            </span>
            {session.created_at}
          </p>
        </div>
      </div>
      {showLogout && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start sm:self-center"
          disabled={isLoggingOut}
          onClick={() => onLogout(session.id)}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("ending_session")}
            </>
          ) : (
            t("logout_session")
          )}
        </Button>
      )}
    </div>
  );
}

export default function ActiveSessions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: async (): Promise<SessionsLoadData> => {
      const response = await controlPrivateApi.get("/profile/sessions/load");
      return normalizeSessionsLoadPayload(response.data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await controlPrivateApi.post(
        `/profile/sessions/${sessionId}/logout`,
      );
      return response.data as { data?: { message?: string } };
    },
    onSuccess: (payload) => {
      const msg =
        (payload as { data?: { message?: string }; message?: string })?.data
          ?.message ?? (payload as { message?: string })?.message;
      toast.success(msg ?? t("session_terminated"));
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (status === 403) {
        toast.error(message ?? t("session_forbidden"));
        return;
      }
      toast.error(message ?? t("failed_to_end_session"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("loading")}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-center text-destructive">
          {t("failed_to_load_sessions")}
        </p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loading")}
            </>
          ) : (
            t("retry")
          )}
        </Button>
      </div>
    );
  }

  const current = data?.current_session ?? null;
  const others = data?.other_sessions ?? [];

  return (
    <div className="max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("active_sessions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {current && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("current_session")}
              </h3>
              <SessionCard
                session={current}
                onLogout={(id) => logoutMutation.mutate(id)}
                isLoggingOut={false}
                showLogout={false}
              />
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("other_sessions")}
            </h3>
            {others.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("no_other_sessions")}
              </p>
            ) : (
              <ul className="space-y-3">
                {others.map((session) => (
                  <li key={session.id}>
                    <SessionCard
                      session={session}
                      onLogout={(sessionId) => logoutMutation.mutate(sessionId)}
                      isLoggingOut={
                        logoutMutation.isPending &&
                        logoutMutation.variables === session.id
                      }
                      showLogout
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
