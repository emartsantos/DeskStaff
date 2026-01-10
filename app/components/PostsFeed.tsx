// src/components/PostsFeed.tsx
import { useState } from "react";
import { CreatePost } from "./CreatePost";
import { usePosts } from "@/hooks/usePosts";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PostsFeedProps {
  currentUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    first_name?: string;
    last_name?: string;
  };
}

export function PostsFeed({ currentUser }: PostsFeedProps) {
  const {
    posts,
    loading,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    addComment,
    loadMore,
    hasMore,
  } = usePosts();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreatePost = async (content: string, image?: File) => {
    try {
      const result = await createPost(content, image);
      if (result) {
        toast.success("Post created successfully!");
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setDeletingId(postId);
    try {
      await deletePost(postId);
      toast.success("Post deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isLiked = post.likes?.[0]?.count > 0;
      try {
        if (isLiked) {
          await unlikePost(postId);
          toast.info("Post unliked");
        } else {
          await likePost(postId);
          toast.success("Post liked!");
        }
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    }
  };

  const handleBookmark = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isBookmarked = post.bookmarks?.[0]?.count > 0;
      try {
        if (isBookmarked) {
          await unbookmarkPost(postId);
          toast.info("Post removed from bookmarks");
        } else {
          await bookmarkPost(postId);
          toast.success("Post bookmarked!");
        }
      } catch (error) {
        console.error("Error toggling bookmark:", error);
      }
    }
  };

  const handleComment = async (postId: string) => {
    const content = prompt("Enter your comment:");
    if (content && content.trim()) {
      try {
        await addComment(postId, content);
        toast.success("Comment added!");
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <CreatePost
        user={currentUser}
        onSubmit={handleCreatePost}
        placeholder="What's on your mind?"
      />

      <div className="space-y-4">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900"
          >
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {post.user.first_name?.[0]}
                      {post.user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {post.user.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {post.user_id === currentUser.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="text-gray-500 hover:text-red-500"
                    title="Delete post"
                  >
                    {deletingId === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(post.image_url!, "_blank")}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Post Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${post.likes?.[0]?.count > 0 ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {post.likes?.[0]?.count || 0}
                  </button>
                  <button
                    onClick={() => handleComment(post.id)}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comments?.[0]?.count || 0} comments
                  </button>
                </div>
                <button
                  onClick={() => handleBookmark(post.id)}
                  className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                  title={
                    post.bookmarks?.[0]?.count > 0
                      ? "Remove bookmark"
                      : "Bookmark post"
                  }
                >
                  <svg
                    className={`h-4 w-4 ${post.bookmarks?.[0]?.count > 0 ? "fill-yellow-500 text-yellow-500" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>

              {/* Post Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleLike(post.id)}
                >
                  <Heart
                    className={`h-5 w-5 ${post.likes?.[0]?.count > 0 ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {post.likes?.[0]?.count > 0 ? "Liked" : "Like"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleComment(post.id)}
                >
                  <MessageCircle className="h-5 w-5" />
                  Comment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/post/${post.id}`
                    );
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="mx-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
