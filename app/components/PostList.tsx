// src/components/PostsList.tsx
import { usePosts } from "@/hooks/usePosts";
import { Post } from "./Post";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PostsListProps {
  userId?: string;
  isOwnProfile?: boolean;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostsList({
  userId,
  isOwnProfile = false,
  onLike,
  onBookmark,
  onDelete,
}: PostsListProps) {
  const { posts, loading, likePost, unlikePost, bookmarkPost, unbookmarkPost } =
    usePosts(userId);

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isLiked = post.likes?.[0]?.count > 0;
      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      onLike?.(postId);
    }
  };

  const handleBookmark = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isBookmarked = post.bookmarks?.[0]?.count > 0;
      if (isBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
      onBookmark?.(postId);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {isOwnProfile
            ? "Share your first post to start the conversation"
            : "This user hasn't posted anything yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          content={post.content}
          image_url={post.image_url}
          created_at={post.created_at}
          likes_count={post.likes?.[0]?.count || 0}
          comments_count={post.comments?.[0]?.count || 0}
          user={post.user}
          liked={post.likes?.[0]?.count > 0}
          bookmarked={post.bookmarks?.[0]?.count > 0}
          isOwnPost={isOwnProfile}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
