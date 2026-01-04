import { queryOptions, useQuery } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";


async function checkUser() {
  return await controlPrivateApi.get("/profile/check-logged-in");
}

export const checkUserQueryOptions = queryOptions({
  queryKey: ["user", "check"],
  async queryFn() {
    const res = await checkUser();
    return res.data;
  },
  select(data) {
    return data.data;
  },
});

export function useCheckUser() {
  return useQuery(checkUserQueryOptions);
}
