import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "@/components/ui/card";
import Pagination from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useReviews } from "@/lib/queries/reviews";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/reviews/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState<{
    page: number;
    rating: string;
    approved: string;
  }>({
    page: 1,
    rating: "",
    approved: "",
  });

  const { data, isLoading, error } = useReviews(filters);

  const reviews = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
    </div>
  );

  const ApprovedBadge = ({ approved }: { approved: boolean }) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        approved
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {approved ? t("approved") : t("pending")}
    </span>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("user")}</TableHead>
          <TableHead>{t("product")}</TableHead>
          <TableHead className="w-[150px]">{t("rating")}</TableHead>
          <TableHead>{t("review")}</TableHead>
          <TableHead className="w-[110px]">{t("status")}</TableHead>
          <TableHead>{t("date")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(7)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <TableRow key={review.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {review.name} {review.surname}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {review.product_variant?.product?.title ?? "—"}
              </TableCell>
              <TableCell>
                <RatingStars rating={review.rating} />
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{review.review}</p>
              </TableCell>
              <TableCell>
                <ApprovedBadge approved={review.is_approved} />
              </TableCell>
              <TableCell>{review.created_at}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse border-b p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))
      ) : reviews.length > 0 ? (
        reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {review.name} {review.surname}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {review.product_variant?.product?.title ?? "—"}
                  </p>
                </div>
                <ApprovedBadge approved={review.is_approved} />
              </div>
              <RatingStars rating={review.rating} />
              <p className="text-sm">{review.review}</p>
              <span className="text-sm text-gray-600">{review.created_at}</span>
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">{t("error_loading_reviews")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("reviews")}</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={filters.approved}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, approved: value === "all" ? "" : value, page: 1 }))
          }
          placeholder={t("all")}
          options={[
            { value: "all", label: t("all") },
            { value: "yes", label: t("approved") },
            { value: "no", label: t("not_approved") },
          ]}
          className="w-[160px]"
        />

        <Select
          value={filters.rating}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, rating: value === "all" ? "" : value, page: 1 }))
          }
          placeholder={t("rating")}
          options={[
            { value: "all", label: t("all") },
            ...([1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `${r} ★` }))),
          ]}
          className="w-[140px]"
        />
      </div>

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />
    </div>
  );
}
