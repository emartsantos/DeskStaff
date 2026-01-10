export type PostType = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  likes: { count: number }[];
  comments: { count: number }[];
  bookmarks: { count: number }[];
  liked: boolean;
  bookmarked: boolean;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
    created_at: string;
  };
};

export type UserType = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  created_at: string;
};
