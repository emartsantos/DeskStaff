// src/components/PostList.tsx
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Send,
  Trash2,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface PostListProps {
  posts: Post[];
  loading: boolean;
  currentUserId?: string | null; // Allow null
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
}

/**
 * Enhanced Skeleton Loader for Posts
 */
function PostSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Avatar Skeleton */}
                <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  {/* Name Skeleton */}
                  <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                  {/* Time Skeleton */}
                  <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              {/* Options Button Skeleton */}
              <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </CardHeader>

          <CardContent className="pb-4 space-y-3">
            {/* Content Line Skeletons */}
            <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />

            {/* Optional Image Skeleton */}
            <Skeleton className="h-64 w-full rounded-lg bg-gray-200 dark:bg-gray-700 mt-2" />
          </CardContent>

          <CardFooter className="pt-0 flex flex-col">
            {/* Stats Skeleton */}
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center border-t border-b border-gray-100 dark:border-gray-800 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 flex justify-center">
                  <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>

            {/* Comment Input Skeleton */}
            <div className="mt-4 flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 relative">
                <Skeleton className="h-10 w-full rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function PostList({
  posts,
  loading,
  currentUserId,
  onLike,
  onBookmark,
  onDelete,
  onAddComment,
}: PostListProps) {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleCommentSubmit = (postId: string) => {
    const comment = commentInputs[postId]?.trim();
    if (!comment) {
      toast.error("Comment cannot be empty");
      return;
    }

    onAddComment(postId, comment);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  // Loading state - show enhanced skeleton
  if (loading) {
    return <PostSkeletonLoader count={3} />;
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 text-center py-12 bg-white dark:bg-gray-900">
        <CardContent>
          <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {currentUserId
              ? "Share your first post with your connections!"
              : "This user hasn't posted anything yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const isOwnPost = currentUserId === post.user_id;

        return (
          <Card
            key={post.id}
            className="border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {post.user.full_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(post.created_at)}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwnPost && onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(post.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        toast.info("Reporting feature coming soon")
                      }
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {post.content}
              </p>

              {post.image_url && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-auto max-h-[400px] object-cover rounded-lg"
                    onClick={() => toast.info("Viewing image in full screen")}
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0 flex flex-col">
              {/* Post Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <span>{post.likes_count} likes</span>
                  <span>{post.comments_count} comments</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center border-t border-b border-gray-100 dark:border-gray-800 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-1 ${post.is_liked ? "text-red-500" : ""}`}
                  onClick={() => onLike(post.id)}
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${post.is_liked ? "fill-current" : ""}`}
                  />
                  Like
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const textarea = document.getElementById(
                      `comment-${post.id}`
                    ) as HTMLTextAreaElement;
                    if (textarea) {
                      textarea.focus();
                    }
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comment
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast.info("Share feature coming soon")}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-1 ${post.is_bookmarked ? "text-blue-500" : ""}`}
                  onClick={() => onBookmark(post.id)}
                >
                  <Bookmark
                    className={`h-5 w-5 mr-2 ${post.is_bookmarked ? "fill-current" : ""}`}
                  />
                  Save
                </Button>
              </div>

              {/* Comment Input */}
              <div className="mt-4 flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {post.user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Input
                    id={`comment-${post.id}`}
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    className="pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCommentSubmit(post.id);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Inline Loader for individual posts (optional)
 */
export function InlinePostLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer effect component (optional)
 */
export function ShimmerEffect() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}
