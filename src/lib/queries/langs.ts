import { queryOptions, useQuery } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

async function getLangs() {
  return await controlPrivateApi.get("/local-translations/languages/list");
}

export const langsQueryOptions = queryOptions({
  queryKey: ["langs"],
  async queryFn() {
    const res = await getLangs();
    return res.data;
  },
  select(data) {
    return data.data;
  },
});

export function useLangs() {
  return useQuery(langsQueryOptions);
}
