// src/components/Post.tsx
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  Globe as GlobeIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

interface PostUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface PostProps {
  id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: PostUser;
  liked: boolean;
  bookmarked: boolean;
  isOwnPost?: boolean;
  onLike: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<void>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}

export function Post({
  id,
  content,
  image_url,
  created_at,
  likes_count,
  comments_count,
  user,
  liked,
  bookmarked,
  isOwnPost = false,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onEdit,
  onDelete,
  showActions = true,
}: PostProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  /**
   * Format date for display
   */
  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  /**
   * Handle like button click
   */
  const handleLike = async () => {
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      await onLike(id);
    } catch (error: any) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like");
    } finally {
      setIsLikeLoading(false);
    }
  };

  /**
   * Handle bookmark button click
   */
  const handleBookmark = async () => {
    if (isBookmarkLoading) return;

    setIsBookmarkLoading(true);
    try {
      await onBookmark(id);
    } catch (error: any) {
      console.error("Error bookmarking post:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  /**
   * Handle edit post action
   */
  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  /**
   * Handle delete post action
   */
  const handleDelete = () => {
    if (onDelete && confirm("Are you sure you want to delete this post?")) {
      onDelete(id);
    }
  };

  /**
   * Handle comment button click
   */
  const handleComment = () => {
    if (onComment) {
      onComment(id);
    }
  };

  /**
   * Handle share button click
   */
  const handleShare = () => {
    if (onShare) {
      onShare(id);
    }
  };

  /**
   * Get user initials for avatar fallback
   */
  const getUserInitials = () => {
    return (
      user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 overflow-hidden bg-white dark:bg-gray-900 transition-all hover:shadow-md">
      <CardContent className="pt-6">
        {/* Post Header - User info and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </p>
                {isOwnPost && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  >
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{formattedDate}</span>
                <GlobeIcon className="h-3 w-3" />
                <span>Public</span>
              </div>
            </div>
          </div>

          {/* Actions dropdown menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[180px]"
                align="end"
              >
                {isOwnPost && onEdit && (
                  <DropdownMenuItem
                    onClick={handleEdit}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleBookmark}
                  disabled={isBookmarkLoading}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Bookmark
                    className={`mr-2 h-4 w-4 ${bookmarked ? "fill-current text-yellow-500" : ""}`}
                  />
                  {isBookmarkLoading
                    ? "Processing..."
                    : bookmarked
                      ? "Remove from Bookmarks"
                      : "Save Post"}
                </DropdownMenuItem>

                {isOwnPost && onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {content}
        </p>

        {/* Post Image */}
        {image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={image_url}
              alt="Post content"
              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1">
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                <span className="text-xs text-white">👍</span>
              </div>
              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                <span className="text-xs text-white">❤️</span>
              </div>
            </div>
            <span>
              {likes_count} {likes_count === 1 ? "reaction" : "reactions"}
            </span>
          </div>
          <div>
            <span>
              {comments_count} {comments_count === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            <Separator className="mb-4 bg-gray-200 dark:bg-gray-700" />

            <div className="grid grid-cols-4 gap-1">
              {/* Like Button */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isLikeLoading}
                className={`gap-2 rounded-lg ${liked ? "text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/10" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleLike}
              >
                {isLikeLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Heart
                    className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`}
                  />
                )}
                {isLikeLoading ? "Processing..." : liked ? "Liked" : "Like"}
              </Button>

              {/* Comment Button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={handleComment}
              >
                <MessageSquare className="h-4 w-4" />
                Comment
              </Button>

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {/* Bookmark Button */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isBookmarkLoading}
                className={`gap-2 rounded-lg ${bookmarked ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 dark:bg-yellow-900/10" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleBookmark}
              >
                {isBookmarkLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 ${bookmarked ? "fill-current text-yellow-500" : ""}`}
                  />
                )}
                {isBookmarkLoading ? "Processing..." : "Save"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
