// src/hooks/usePosts.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PostUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  first_name?: string;
  last_name?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user: PostUser;
  likes: { count: number }[];
  comments: { count: number }[];
  bookmarks: { count: number }[];
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  createPost: (content: string, image?: File) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const POSTS_PER_PAGE = 10;

export function usePosts(userId?: string): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPosts = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const from = pageNum * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        let query = supabase
          .from("posts")
          .select(
            `
          *,
          user:users (
            id,
            full_name,
            avatar_url,
            first_name,
            last_name
          ),
          likes:post_likes(count),
          comments:post_comments(count),
          bookmarks:post_bookmarks(count)
        `,
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        // If userId is provided, filter by user
        if (userId) {
          query = query.eq("user_id", userId);
        }

        const { data, error: fetchError, count } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (append) {
          setPosts((prev) => [...prev, ...(data || [])]);
        } else {
          setPosts(data || []);
        }

        // Check if there are more posts
        if (count !== null) {
          setHasMore((pageNum + 1) * POSTS_PER_PAGE < count);
        }

        return data || [];
      } catch (err: any) {
        console.error("Error fetching posts:", err);
        setError(err.message || "Failed to load posts");
        toast.error("Failed to load posts");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchPosts(0, false);
    setPage(0);

    // Set up real-time subscription for new posts
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          // Fetch the new post with user data
          const { data: newPost } = await supabase
            .from("posts")
            .select(
              `
              *,
              user:users (
                id,
                full_name,
                avatar_url,
                first_name,
                last_name
              ),
              likes:post_likes(count),
              comments:post_comments(count),
              bookmarks:post_bookmarks(count)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (newPost) {
            setPosts((prev) => [newPost, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    await fetchPosts(nextPage, true);
    setPage(nextPage);
  };

  const createPost = async (
    content: string,
    image?: File
  ): Promise<Post | null> => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create a post");
      }

      let imageUrl: string | undefined;

      // Upload image if provided
      if (image) {
        try {
          const fileExt = image.name.split(".").pop();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          const fileName = `post_${timestamp}_${randomStr}.${fileExt}`;
          const filePath = `posts/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("post_images")
            .upload(filePath, image, {
              cacheControl: "3600",
              upsert: false,
              contentType: image.type,
            });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("post_images").getPublicUrl(filePath);

          imageUrl = `${publicUrl}?t=${timestamp}`;
        } catch (uploadErr: any) {
          console.error("Error uploading image:", uploadErr);
          toast.error("Failed to upload image. Post created without image.");
        }
      }

      // Create post
      const { data, error: createError } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            image_url: imageUrl,
          },
        ])
        .select(
          `
          *,
          user:users (
            id,
            full_name,
            avatar_url,
            first_name,
            last_name
          ),
          likes:post_likes(count),
          comments:post_comments(count),
          bookmarks:post_bookmarks(count)
        `
        )
        .single();

      if (createError) throw createError;

      return data;
    } catch (err: any) {
      console.error("Error creating post:", err);
      toast.error(err.message || "Failed to create post");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      // First check if user owns the post
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in");

      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post not found");

      if (post.user_id !== user.id) {
        throw new Error("You can only delete your own posts");
      }

      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      // Post will be removed from state via real-time subscription
    } catch (err: any) {
      console.error("Error deleting post:", err);
      toast.error(err.message || "Failed to delete post");
      throw err;
    }
  };

  const likePost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to like a post");

      const { error } = await supabase
        .from("post_likes")
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        // If already liked, unlike it
        if (error.code === "23505") {
          // Unique violation
          await unlikePost(postId);
          return;
        }
        throw error;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: [{ count: (post.likes[0]?.count || 0) + 1 }],
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Error liking post:", err);
      toast.error(err.message || "Failed to like post");
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to unlike a post");

      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: [{ count: Math.max(0, (post.likes[0]?.count || 0) - 1) }],
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Error unliking post:", err);
      toast.error(err.message || "Failed to unlike post");
    }
  };

  const bookmarkPost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to bookmark a post");

      const { error } = await supabase
        .from("post_bookmarks")
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        // If already bookmarked, unbookmark it
        if (error.code === "23505") {
          await unbookmarkPost(postId);
          return;
        }
        throw error;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarks: [{ count: (post.bookmarks[0]?.count || 0) + 1 }],
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Error bookmarking post:", err);
      toast.error(err.message || "Failed to bookmark post");
    }
  };

  const unbookmarkPost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to unbookmark a post");

      const { error } = await supabase
        .from("post_bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarks: [
                { count: Math.max(0, (post.bookmarks[0]?.count || 0) - 1) },
              ],
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Error unbookmarking post:", err);
      toast.error(err.message || "Failed to unbookmark post");
    }
  };

  const addComment = async (postId: string, content: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to comment");

      const { error } = await supabase
        .from("post_comments")
        .insert([
          { post_id: postId, user_id: user.id, content: content.trim() },
        ]);

      if (error) throw error;

      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [{ count: (post.comments[0]?.count || 0) + 1 }],
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Error adding comment:", err);
      toast.error(err.message || "Failed to add comment");
    }
  };

  const refreshPosts = async () => {
    await fetchPosts(0, false);
    setPage(0);
  };

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    addComment,
    loadMore,
    refreshPosts,
  };
}
