// src/components/ProfilePictureUpload.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase, bustGlobalCache } from "@/lib/supabase";
import { useGlobalCacheBust } from "@/hooks/useGlobalCacheBust";

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
  const [localImageKey, setLocalImageKey] = useState(Date.now());

  const { getBustedUrl, version } = useGlobalCacheBust();

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

  // Force image refresh when global cache bust version changes
  useEffect(() => {
    setLocalImageKey(Date.now());
  }, [version]);

  const forceImageRefresh = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 3000);

        return blobUrl;
      }
    } catch (error) {
      console.warn("Could not force refresh image:", error);
    }

    return getBustedUrl(url);
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
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const fileName = `${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const immediateUrl = `${publicUrl}?_=${timestamp}&cb=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: immediateUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        await supabase.storage.from("avatars").remove([filePath]);
        throw updateError;
      }

      // Bust global cache
      bustGlobalCache();

      // Force local image key update
      setLocalImageKey(Date.now());

      let finalUrl = immediateUrl;
      try {
        const refreshedUrl = await forceImageRefresh(immediateUrl);
        finalUrl = refreshedUrl;
      } catch (error) {
        console.warn("Using regular URL for image:", error);
      }

      onUploadComplete(finalUrl);
      setUploadSuccess(true);

      // Cleanup old avatars in background
      setTimeout(async () => {
        try {
          const { data: oldFiles } = await supabase.storage
            .from("avatars")
            .list(userId);

          if (oldFiles) {
            const filesToDelete = oldFiles
              .filter((f) => f.name !== fileName)
              .map((f) => `${userId}/${f.name}`);

            if (filesToDelete.length > 0) {
              await supabase.storage.from("avatars").remove(filesToDelete);
            }
          }
        } catch (error) {
          console.warn("Failed to cleanup old avatars:", error);
        }
      }, 2000);

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
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;

    setIsUploading(true);

    try {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      const { error } = await supabase
        .from("users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      // Bust global cache on removal too
      bustGlobalCache();
      setLocalImageKey(Date.now());

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

  const avatarUrl = currentAvatarUrl ? getBustedUrl(currentAvatarUrl) : null;
  const imageKey = `${avatarUrl || ""}_${localImageKey}_${version}`;

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
            {avatarUrl && !isUploading ? (
              <AvatarImage
                src={avatarUrl}
                alt="Profile"
                className="object-cover"
                key={imageKey}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (currentAvatarUrl && target.src !== currentAvatarUrl) {
                    target.src = getBustedUrl(currentAvatarUrl);
                  }
                }}
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
        {avatarUrl && !isUploading ? (
          <AvatarImage
            src={avatarUrl}
            alt="Profile"
            className="object-cover"
            key={imageKey}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (currentAvatarUrl && target.src !== currentAvatarUrl) {
                target.src = getBustedUrl(currentAvatarUrl);
              }
            }}
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
