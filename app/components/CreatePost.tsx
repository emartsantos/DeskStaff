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

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  first_name?: string;
}

interface CreatePostProps {
  user: UserProfile | null;
  onSubmit: (content: string, image?: File) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function CreatePost({
  user,
  onSubmit,
  placeholder = "What's on your mind?",
  disabled = false,
}: CreatePostProps) {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
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

  const handleSubmit = async () => {
    if (!newPost.trim() && !selectedImage) return;

    setIsPosting(true);
    try {
      await onSubmit(newPost, selectedImage || undefined);
      setNewPost("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder={`${placeholder} ${user?.first_name}?`}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={disabled || isPosting}
            />

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 backdrop-blur-sm"
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
                    disabled={isPosting}
                  />
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">Photo</span>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  disabled={isPosting}
                >
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  disabled={isPosting}
                >
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <Smile className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">Feeling</span>
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  isPosting || (!newPost.trim() && !selectedImage) || disabled
                }
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
      </CardContent>
    </Card>
  );
}
