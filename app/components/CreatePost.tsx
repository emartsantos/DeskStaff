// src/components/CreatePost.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Image as ImageIcon,
  Video,
  Smile,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  first_name?: string;
  last_name?: string;
}

interface CreatePostProps {
  user: UserProfile | null;
  onSubmit?: (content: string, image?: File) => Promise<any>;
  placeholder?: string;
  disabled?: boolean;
  onPostCreated?: (post: any) => void;
  autoSave?: boolean;
}

export function CreatePost({
  user,
  onSubmit,
  placeholder = "What's on your mind?",
  disabled = false,
  onPostCreated,
  autoSave = true,
}: CreatePostProps) {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadPostImage = async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `post_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `posts/${user.id}/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("post_images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("post_images").getPublicUrl(filePath);

      // Add cache busting parameter
      return `${publicUrl}?t=${timestamp}`;
    } catch (error: any) {
      console.error("Upload failed:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Please sign in to create a post");
      return;
    }

    if (!newPost.trim() && !selectedImage) {
      toast.error("Post cannot be empty");
      return;
    }

    setIsPosting(true);

    try {
      let result;

      if (onSubmit) {
        // Use custom submit handler if provided
        result = await onSubmit(newPost, selectedImage || undefined);
      } else if (autoSave) {
        // Otherwise use the default implementation (should be used with usePosts hook)
        toast.error(
          "CreatePost component requires onSubmit prop when autoSave is true"
        );
        return;
      }

      // Reset form
      setNewPost("");
      setSelectedImage(null);
      setImagePreview(null);

      // Call the callback if provided
      if (onPostCreated && result) {
        onPostCreated(result);
      }

      if (!onSubmit) {
        toast.success("Post created successfully!");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={user?.avatar_url || undefined}
              alt={user?.full_name || "User"}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {user?.first_name?.[0] || ""}
              {user?.last_name?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder={`${placeholder} ${user?.first_name || ""}?`}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              disabled={disabled || isPosting}
            />

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 backdrop-blur-sm bg-red-500/80 hover:bg-red-600/80"
                  onClick={removeImage}
                  disabled={isPosting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isPosting || disabled}
                  />
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline font-medium">Photo</span>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  disabled={isPosting || disabled}
                  onClick={() => toast.info("Video upload coming soon!")}
                >
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline font-medium">Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  disabled={isPosting || disabled}
                  onClick={() => toast.info("Feeling picker coming soon!")}
                >
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                    <Smile className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline font-medium">Feeling</span>
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {newPost.trim() || selectedImage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPost("");
                      removeImage();
                    }}
                    disabled={isPosting || disabled}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isPosting || disabled || (!newPost.trim() && !selectedImage)
                  }
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
