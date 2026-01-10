// src/hooks/usePosts.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type UserType = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  created_at: string;
};

type PostType = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  liked: boolean;
  bookmarked: boolean;
  user: UserType;
};

export function usePosts(userId?: string) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID on mount
  useEffect(() => {
    const getCurrentUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUserId();
  }, []);

  /**
   * Fetch posts from the database with user data and counts
   */
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching posts...");

      // First, fetch posts with user info
      let postsQuery = supabase
        .from("posts")
        .select(
          `
          *,
          user:users(id, first_name, last_name, full_name, avatar_url, email, created_at)
        `
        )
        .order("created_at", { ascending: false });

      if (userId) {
        postsQuery = postsQuery.eq("user_id", userId);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get post IDs for batch queries
      const postIds = postsData.map((post) => post.id);

      // Fetch likes, bookmarks, and comments in parallel
      const [likesResponse, bookmarksResponse, commentsResponse] =
        await Promise.all([
          supabase
            .from("post_likes")
            .select("post_id, user_id")
            .in("post_id", postIds),
          supabase
            .from("post_bookmarks")
            .select("post_id, user_id")
            .in("post_id", postIds),
          supabase
            .from("post_comments")
            .select("post_id")
            .in("post_id", postIds),
        ]);

      // Handle errors gracefully
      if (likesResponse.error) {
        console.error("Error fetching likes:", likesResponse.error);
      }
      if (bookmarksResponse.error) {
        console.error("Error fetching bookmarks:", bookmarksResponse.error);
      }
      if (commentsResponse.error) {
        console.error("Error fetching comments:", commentsResponse.error);
      }

      const likesData = likesResponse.data || [];
      const bookmarksData = bookmarksResponse.data || [];
      const commentsData = commentsResponse.data || [];

      // Combine all data
      const postsWithRelations = postsData.map((post) => {
        // Count likes for this post
        const postLikes = likesData.filter((like) => like.post_id === post.id);
        const likesCount = postLikes.length;

        // Check if current user liked this post
        const userLiked = currentUserId
          ? postLikes.some((like) => like.user_id === currentUserId)
          : false;

        // Count bookmarks for this post
        const postBookmarks = bookmarksData.filter(
          (bookmark) => bookmark.post_id === post.id
        );
        const bookmarksCount = postBookmarks.length;

        // Check if current user bookmarked this post
        const userBookmarked = currentUserId
          ? postBookmarks.some((bookmark) => bookmark.user_id === currentUserId)
          : false;

        // Count comments for this post
        const postComments = commentsData.filter(
          (comment) => comment.post_id === post.id
        );
        const commentsCount = postComments.length;

        return {
          ...post,
          likes_count: likesCount,
          comments_count: commentsCount,
          bookmarks_count: bookmarksCount,
          liked: userLiked,
          bookmarked: userBookmarked,
        } as PostType;
      });

      setPosts(postsWithRelations);
      console.log(`Fetched ${postsWithRelations.length} posts`);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      setError(error.message || "Failed to load posts");
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  /**
   * Set up real-time subscriptions for posts, likes, and comments
   */
  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    const postsChannel = supabase
      .channel("posts-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const newPost = payload.new;
          if (!userId || newPost.user_id === userId) {
            // Fetch full post data including user info
            const { data: fullPost, error } = await supabase
              .from("posts")
              .select(
                `
                *,
                user:users(id, first_name, last_name, full_name, avatar_url, email, created_at)
              `
              )
              .eq("id", newPost.id)
              .single();

            if (!error && fullPost) {
              setPosts((prev) => [
                {
                  ...fullPost,
                  likes_count: 0,
                  comments_count: 0,
                  bookmarks_count: 0,
                  liked: false,
                  bookmarked: false,
                } as PostType,
                ...prev,
              ]);
              toast.success("New post added!");
            }
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
          toast.info("Post deleted");
        }
      )
      .subscribe();

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel("likes-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
        },
        (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (!postId) return;

          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === postId) {
                let likesCount = post.likes_count || 0;
                let liked = post.liked;

                if (payload.eventType === "INSERT") {
                  likesCount += 1;
                  if (currentUserId === payload.new.user_id) {
                    liked = true;
                  }
                } else if (payload.eventType === "DELETE") {
                  likesCount = Math.max(0, likesCount - 1);
                  if (currentUserId === payload.old.user_id) {
                    liked = false;
                  }
                }

                return {
                  ...post,
                  likes_count: likesCount,
                  liked,
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel("comments-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
        },
        (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (!postId) return;

          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === postId) {
                let commentCount = post.comments_count || 0;

                if (payload.eventType === "INSERT") {
                  commentCount += 1;
                } else if (payload.eventType === "DELETE") {
                  commentCount = Math.max(0, commentCount - 1);
                }

                return {
                  ...post,
                  comments_count: commentCount,
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    // Subscribe to bookmarks changes
    const bookmarksChannel = supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_bookmarks",
        },
        (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (!postId) return;

          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === postId) {
                let bookmarked = post.bookmarked;

                if (payload.eventType === "INSERT") {
                  if (currentUserId === payload.new.user_id) {
                    bookmarked = true;
                  }
                } else if (payload.eventType === "DELETE") {
                  if (currentUserId === payload.old.user_id) {
                    bookmarked = false;
                  }
                }

                return {
                  ...post,
                  bookmarked,
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(bookmarksChannel);
    };
  }, [fetchPosts, userId, currentUserId]);

  /**
   * Create a new post with optimistic update
   */
  const createPost = async (content: string, image?: File) => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // Get current user data for optimistic post
      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
      }

      // Create optimistic post
      const optimisticPost: PostType = {
        id: `temp-${Date.now()}`,
        user_id: authUser.id,
        content,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        bookmarks_count: 0,
        liked: false,
        bookmarked: false,
        user: {
          id: authUser.id,
          first_name: currentUser?.first_name || "User",
          last_name: currentUser?.last_name || "",
          full_name: currentUser?.full_name || "User",
          avatar_url: currentUser?.avatar_url || null,
          email: currentUser?.email || authUser.email || "",
          created_at: currentUser?.created_at || new Date().toISOString(),
        },
      };

      // Add optimistic post immediately
      setPosts((prev) => [optimisticPost, ...prev]);

      let imageUrl = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/${authUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, image);

        if (uploadError) {
          // Remove optimistic post if upload fails
          setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
          toast.error("Failed to upload image");
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        imageUrl = urlData?.publicUrl || null;
      }

      // Create post in database
      const { data, error: createError } = await supabase
        .from("posts")
        .insert({
          user_id: authUser.id,
          content,
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0,
          bookmarks_count: 0,
        })
        .select(
          `
          *,
          user:users(id, first_name, last_name, full_name, avatar_url, email, created_at)
        `
        )
        .single();

      if (createError) {
        // Remove optimistic post on error
        setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
        throw createError;
      }

      // Replace optimistic post with real one
      setPosts((prev) =>
        prev.map((post) =>
          post.id === optimisticPost.id
            ? {
                ...data,
                likes_count: 0,
                comments_count: 0,
                bookmarks_count: 0,
                liked: false,
                bookmarked: false,
              }
            : post
        )
      );

      toast.success("Post created successfully");
      return data;
    } catch (error: any) {
      console.error("Failed to create post:", error.message);
      toast.error("Failed to create post");
      throw error;
    }
  };

  /**
   * Delete a post
   */
  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      toast.success("Post deleted");
    } catch (error: any) {
      console.error("Failed to delete post:", error.message);
      toast.error("Failed to delete post");
      throw error;
    }
  };

  /**
   * Like a post with optimistic update
   */
  const likePost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post not found");

      // Check if already liked
      if (post.liked) {
        await unlikePost(postId);
        return;
      }

      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: (post.likes_count || 0) + 1,
              liked: true,
            };
          }
          return post;
        })
      );

      // Insert like in database
      const { error } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        // Rollback optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likes_count: Math.max(0, (post.likes_count || 0) - 1),
                liked: false,
              };
            }
            return post;
          })
        );
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to like post:", error.message);
      toast.error("Failed to like post");
      throw error;
    }
  };

  /**
   * Unlike a post with optimistic update
   */
  const unlikePost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: Math.max(0, (post.likes_count || 0) - 1),
              liked: false,
            };
          }
          return post;
        })
      );

      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        // Rollback optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likes_count: (post.likes_count || 0) + 1,
                liked: true,
              };
            }
            return post;
          })
        );
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to unlike post:", error.message);
      toast.error("Failed to unlike post");
      throw error;
    }
  };

  /**
   * Bookmark a post with optimistic update
   */
  const bookmarkPost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post not found");

      // Check if already bookmarked
      if (post.bookmarked) {
        await unbookmarkPost(postId);
        return;
      }

      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, bookmarked: true };
          }
          return post;
        })
      );

      const { error } = await supabase.from("post_bookmarks").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        // Rollback optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, bookmarked: false };
            }
            return post;
          })
        );
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to bookmark post:", error.message);
      toast.error("Failed to bookmark post");
      throw error;
    }
  };

  /**
   * Remove bookmark from a post with optimistic update
   */
  const unbookmarkPost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, bookmarked: false };
          }
          return post;
        })
      );

      const { error } = await supabase
        .from("post_bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        // Rollback optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, bookmarked: true };
            }
            return post;
          })
        );
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to remove bookmark:", error.message);
      toast.error("Failed to remove bookmark");
      throw error;
    }
  };

  /**
   * Add a comment to a post
   */
  const addComment = async (postId: string, content: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
      });

      if (error) throw error;

      toast.success("Comment added");
    } catch (error: any) {
      console.error("Failed to add comment:", error.message);
      toast.error("Failed to add comment");
      throw error;
    }
  };

  /**
   * Toggle like status for a post
   */
  const toggleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.liked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  /**
   * Toggle bookmark status for a post
   */
  const toggleBookmark = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.bookmarked) {
      await unbookmarkPost(postId);
    } else {
      await bookmarkPost(postId);
    }
  };

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    addComment,
    toggleLike,
    toggleBookmark,
  };
}
