import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploader from "@/components/ui/image-uploader";

// Profile data interface based on the API response
interface ProfileData {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  image: string | null;
  role_ids: Array<number>;
  roles: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
}

interface ApiResponse {
  data: ProfileData;
  token: string | null;
}

// File data interface for image uploader
interface FileData {
  file?: File | null | string;
  preview?: string;
}

export default function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<FileData>({});

  // Form validation schema
  const profileFormSchema = z.object({
    name: z.string().min(1, t("required_field")),
    surname: z.string().min(1, t("required_field")),
    phone: z.string().min(1, t("required_field")),
  });
  type ProfileFormData = z.infer<typeof profileFormSchema>;

  // Fetch current profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async (): Promise<ApiResponse> => {
      const response = await controlPrivateApi.get("/profile/me");
      return response.data;
    },
  });

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      surname: "",
      phone: "",
    },
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data;
      // Reset form with profile data
      form.reset({
        name: profile.name || "",
        surname: profile.surname || "",
        phone: profile.phone || "",
      });

      // Set image preview if profile has an image
      if (profile.image) {
        setImageFile({
          file: profile.image,
          preview: profile.image,
        });
      }
    }
  }, [profileData, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const formData = new FormData();

      // Add form fields according to API spec: name, surname, phone, image
      formData.append("name", data.name);
      formData.append("surname", data.surname);
      formData.append("phone", data.phone);

      // Add image file if a new one was selected
      if (imageFile.file instanceof File) {
        formData.append("image", imageFile.file);
      }

      const response = await controlPrivateApi.post(
        "/profile/update",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("profile_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("failed_to_update_profile"),
      );
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">{t("loading")}</span>
      </div>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {t("failed_to_load_profile_data")}
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["profile-me"] })
            }
            variant="outline"
          >
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-6">
      <div className="w-full">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image */}
          <div className="space-y-2">
            <Label htmlFor="image">{t("profile_image")}</Label>
            <ImageUploader file={imageFile} setFile={setImageFile} />
          </div>

          {/* Username (Read-only) */}
          {profileData?.data && (
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                value={profileData.data.username}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          )}

          {/* Email (Read-only) */}
          {profileData?.data && (
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={profileData.data.email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")} *</Label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="name"
                  {...field}
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
              )}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Surname */}
          <div className="space-y-2">
            <Label htmlFor="surname">{t("surname")} *</Label>
            <Controller
              name="surname"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="surname"
                  {...field}
                  className={
                    form.formState.errors.surname ? "border-red-500" : ""
                  }
                />
              )}
            />
            {form.formState.errors.surname && (
              <p className="text-sm text-red-600">
                {form.formState.errors.surname.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")} *</Label>
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="phone"
                  type="tel"
                  {...field}
                  className={
                    form.formState.errors.phone ? "border-red-500" : ""
                  }
                />
              )}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="min-w-[120px]"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("updating")}
                </>
              ) : (
                t("update_profile")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
