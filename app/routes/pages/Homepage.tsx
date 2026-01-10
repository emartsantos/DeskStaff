// src/pages/HomePage.tsx
import { Header } from "@/components/Header";
import { PostsFeed } from "@/components/PostsFeed";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Add Header */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Conditionally render content based on auth */}
          {!user ? (
            <div className="mt-20 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Please sign in to view posts
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You need to be logged in to access the community feed.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Community Feed
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Stay updated with posts from your colleagues
                </p>
              </div>
              <PostsFeed currentUser={user} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
