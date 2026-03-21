import { queryOptions, useQuery } from "@tanstack/react-query";
import { controlApi } from "../axios/controlApi";

export interface Country {
  id: number;
  title: string;
}

export interface City {
  id: number;
  title: string;
}

async function getCountries() {
  const response = await controlApi.get("/countries/list");
  return response.data.data as Country[];
}

async function getCities(countryId: number) {
  const response = await controlApi.get(
    `/countries/${countryId}/cities/list`,
  );
  return response.data.data as City[];
}

export const countriesQueryOptions = queryOptions({
  queryKey: ["countries"],
  queryFn: getCountries,
  staleTime: 10 * 60 * 1000,
});

export const citiesQueryOptions = (countryId: number | null) =>
  queryOptions({
    queryKey: ["cities", countryId],
    queryFn: () => getCities(countryId!),
    enabled: !!countryId,
    staleTime: 10 * 60 * 1000,
  });

export function useCountries() {
  return useQuery(countriesQueryOptions);
}

export function useCities(countryId: number | null) {
  return useQuery(citiesQueryOptions(countryId));
}
