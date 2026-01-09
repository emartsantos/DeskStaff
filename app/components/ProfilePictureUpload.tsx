// src/components/ProfilePictureUpload.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ProfilePictureUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadComplete: (avatarUrl: string) => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  showRemoveButton?: boolean;
  compact?: boolean;
}

export function ProfilePictureUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  size = "md",
  editable = true,
  showRemoveButton = true,
  compact = false,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const sizeClasses = {
    xs: "h-8 w-8",
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  const iconSizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Delete old avatar if exists
      if (currentAvatarUrl && currentAvatarUrl.includes("supabase.co")) {
        try {
          const oldFileName = currentAvatarUrl.split("/").pop();
          if (oldFileName) {
            await supabase.storage
              .from("avatars")
              .remove([`${userId}/${oldFileName}`]);
          }
        } catch (deleteError) {
          console.warn("Could not delete old avatar:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      // Callback with new URL
      onUploadComplete(publicUrl);
      setUploadSuccess(true);

      // Reset success state after 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);

      if (!compact) {
        toast.success("Profile picture updated!");
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!userId || !currentAvatarUrl) return;

    setIsUploading(true);

    try {
      // Delete from storage
      if (currentAvatarUrl.includes("supabase.co")) {
        const fileName = currentAvatarUrl.split("/").pop();
        if (fileName) {
          await supabase.storage
            .from("avatars")
            .remove([`${userId}/${fileName}`]);
        }
      }

      // Update user profile
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) throw error;

      // Callback with empty URL
      onUploadComplete("");
      toast.success("Profile picture removed");
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      toast.error(error.message || "Failed to remove profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatarInitials = () => {
    return "U";
  };

  if (compact) {
    return (
      <div className="relative">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Avatar
            className={`${sizeClasses[size]} border-2 border-transparent hover:border-blue-500 transition-all duration-200`}
          >
            {currentAvatarUrl && !isUploading ? (
              <AvatarImage
                src={`${currentAvatarUrl}?t=${Date.now()}`}
                alt="Profile"
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {isUploading ? (
                <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
              ) : uploadSuccess ? (
                <Check className={`${iconSizeClasses[size]} text-green-400`} />
              ) : (
                getAvatarInitials()
              )}
            </AvatarFallback>
          </Avatar>
        </label>
      </div>
    );
  }

  return (
    <div className="relative group">
      <Avatar
        className={`${sizeClasses[size]} border-2 border-white dark:border-gray-800 shadow-md transition-all duration-200 ${
          isHovering && editable ? "scale-105" : ""
        }`}
        onMouseEnter={() => editable && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {currentAvatarUrl && !isUploading ? (
          <AvatarImage
            src={`${currentAvatarUrl}?t=${Date.now()}`}
            alt="Profile"
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          {isUploading ? (
            <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
          ) : uploadSuccess ? (
            <Check className={`${iconSizeClasses[size]} text-green-400`} />
          ) : (
            getAvatarInitials()
          )}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          {/* Upload Button */}
          <label
            className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer transition-all duration-200 ${
              isHovering ? "opacity-100" : "opacity-0"
            } ${isUploading ? "pointer-events-none" : ""}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-1">
              <Camera className={`${iconSizeClasses[size]} text-white`} />
              {size !== "xs" && size !== "sm" && (
                <span className="text-white text-xs font-medium">
                  {isUploading ? "Uploading..." : "Change"}
                </span>
              )}
            </div>
          </label>

          {/* Remove Button (only if has avatar) */}
          {currentAvatarUrl && showRemoveButton && !isUploading && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className={`absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md transition-all duration-200 ${
                isHovering ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
              onClick={handleRemoveAvatar}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </>
      )}

      {/* Progress Indicator */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 rounded-full" />
          <div className="relative">
            <div
              className={`${sizeClasses[size].replace("h-", "h-").replace("w-", "w-")} border-4 border-white/30 border-t-white rounded-full animate-spin`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
