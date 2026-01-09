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
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
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
  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
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
                    className="text-xs bg-blue-50 dark:bg-blue-900/20"
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
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {isOwnPost && onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(id)}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onBookmark(id)}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Bookmark
                    className={`mr-2 h-4 w-4 ${bookmarked ? "fill-current text-yellow-500" : ""}`}
                  />
                  {bookmarked ? "Remove from Bookmarks" : "Save Post"}
                </DropdownMenuItem>
                {isOwnPost && onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => onDelete(id)}
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

        <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          {content}
        </p>

        {image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={image_url}
              alt="Post"
              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>
        )}

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
            <span>{likes_count} reactions</span>
          </div>
          <div>
            <span>{comments_count} comments</span>
          </div>
        </div>

        {showActions && (
          <>
            <Separator className="mb-4 bg-gray-200 dark:bg-gray-700" />

            <div className="grid grid-cols-4 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${liked ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                onClick={() => onLike(id)}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Liked" : "Like"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 dark:text-gray-400"
                onClick={() => onComment?.(id)}
              >
                <MessageSquare className="h-4 w-4" />
                Comment
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 dark:text-gray-400"
                onClick={() => onShare?.(id)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${bookmarked ? "text-yellow-600" : "text-gray-600 dark:text-gray-400"}`}
                onClick={() => onBookmark(id)}
              >
                <Bookmark
                  className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
                />
                Save
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
