// src/components/PostsFeed.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  ThumbsUp,
  Smile,
  Loader2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    position?: string;
  };
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string | null;
  video_url?: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    position?: string;
  };
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface PostsFeedProps {
  currentUser: User;
}

export function PostsFeed({ currentUser }: PostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // First, fetch posts with user information
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
        *,
        user:users(id, full_name, avatar_url)
      `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Fetch likes and bookmarks separately
      const postIds = postsData.map((post: any) => post.id);

      // Fetch likes for current user
      const { data: userLikes, error: likesError } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", currentUser.id)
        .in("post_id", postIds);

      if (likesError && likesError.code !== "PGRST116") throw likesError;

      // Fetch bookmarks for current user
      const { data: userBookmarks, error: bookmarksError } = await supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", currentUser.id)
        .in("post_id", postIds);

      if (bookmarksError && bookmarksError.code !== "PGRST116")
        throw bookmarksError;

      // Create sets for quick lookup
      const likedPostIds = new Set(
        userLikes?.map((like: any) => like.post_id) || []
      );
      const bookmarkedPostIds = new Set(
        userBookmarks?.map((bookmark: any) => bookmark.post_id) || []
      );

      // Transform the data
      const transformedPosts = postsData.map((post: any) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_bookmarked: bookmarkedPostIds.has(post.id),
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
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
    if (!currentUser?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `post_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `posts/${currentUser.id}/${fileName}`;

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

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedImage) {
      toast.error("Post cannot be empty");
      return;
    }

    setIsPosting(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        try {
          imageUrl = await uploadPostImage(selectedImage);
        } catch (error) {
          toast.error("Failed to upload image");
          setIsPosting(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: postContent.trim(),
          user_id: currentUser.id,
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Post created successfully");
      setPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      fetchPosts(); // Refresh the feed
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        // Unlike the post
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        // Update the post
        const { error: updateError } = await supabase
          .from("posts")
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(
          posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_liked: false,
                  likes_count: Math.max(0, p.likes_count - 1),
                }
              : p
          )
        );
      } else {
        // Like the post
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: currentUser.id,
        });

        if (error) throw error;

        // Update the post
        const { error: updateError } = await supabase
          .from("posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(
          posts.map((p) =>
            p.id === postId
              ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.is_bookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("post_bookmarks")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, is_bookmarked: false } : p
          )
        );
      } else {
        // Add bookmark
        const { error } = await supabase.from("post_bookmarks").insert({
          post_id: postId,
          user_id: currentUser.id,
        });

        if (error) throw error;

        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, is_bookmarked: true } : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleAddComment = async (postId: string) => {
    const comment = commentInputs[postId]?.trim();
    if (!comment) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      // Add comment
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: currentUser.id,
        content: comment,
      });

      if (error) throw error;

      // Update post comment count
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const { error: updateError } = await supabase
          .from("posts")
          .update({ comments_count: post.comments_count + 1 })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
          )
        );
      }

      toast.success("Comment added");
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts(); // Refresh to get the new comment
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUser.id);

      if (error) throw error;

      toast.success("Post deleted");
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleCreatePost();
    }
  };

  const filteredPosts = () => {
    switch (activeTab) {
      case "following":
        // In a real app, filter by followed users
        return posts;
      case "popular":
        return [...posts].sort((a, b) => b.likes_count - a.likes_count);
      default:
        return posts;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
          <TabsTrigger
            value="all"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            All Posts
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Following
          </TabsTrigger>
          <TabsTrigger
            value="popular"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          >
            <Heart className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          {filteredPosts().length === 0 ? (
            <Card className="border-gray-200 dark:border-gray-700 text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Be the first to share something with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts().map((post) => (
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
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {post.user.full_name}
                          </h4>
                          {post.user.position && (
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                              {post.user.position}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>

                    {post.user_id === currentUser.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600"
                          >
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                      <span>{post.shares_count} shares</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center border-t border-b border-gray-100 dark:border-gray-800 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 ${post.is_liked ? "text-red-500" : ""}`}
                      onClick={() => handleLikePost(post.id)}
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
                      onClick={() => handleBookmarkPost(post.id)}
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
                        {currentUser.user_metadata?.full_name
                          ? currentUser.user_metadata.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : currentUser.email?.charAt(0).toUpperCase()}
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
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
