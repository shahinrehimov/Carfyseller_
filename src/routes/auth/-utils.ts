import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";

export function useRedirectBack(redirect?: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    queryClient
      .ensureQueryData(checkUserQueryOptions)
      .catch(() => {})
      .then(() =>
        navigate({
          to: redirect ?? "/",
        }),
      );
  };
}
