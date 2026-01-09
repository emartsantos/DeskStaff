import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  Building,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Users as UsersIcon,
  UserPlus,
  MessageSquare,
  Edit,
} from "lucide-react";

interface UserInfoCardProps {
  user: {
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
    position?: string;
    department?: string;
    location?: string | null;
    email?: string;
    phone?: string;
    hire_date?: string;
    logged_in?: boolean;
    last_seen?: string;
    created_at?: string;
  };
  connectionsCount?: number;
  isOwnProfile?: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export function UserInfoCard({
  user,
  connectionsCount = 0,
  isOwnProfile = false,
  onConnect,
  onMessage,
  onEdit,
  showActions = true,
}: UserInfoCardProps) {
  const renderStatusBadge = () => {
    if (user.logged_in) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
          Online
        </Badge>
      );
    }
    if (user.last_seen) {
      return (
        <Badge
          variant="outline"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"></div>
          Offline
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Professional Information
          </span>
          {isOwnProfile && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-gray-600 dark:text-gray-400"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.bio ? (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {user.bio}
          </p>
        ) : (
          <p className="text-gray-400 italic">No summary added yet</p>
        )}

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {user.position && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BriefcaseBusiness className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Position
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.position}
                </p>
              </div>
            </div>
          )}

          {user.department && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Department
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.department}
                </p>
              </div>
            </div>
          )}

          {user.location && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Location
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.location}
                </p>
              </div>
            </div>
          )}

          {user.email && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Email
                </p>
                <p className="text-gray-600 dark:text-gray-300 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Phone
                </p>
                <p className="text-gray-600 dark:text-gray-300">{user.phone}</p>
              </div>
            </div>
          )}

          {user.hire_date && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Hire Date
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(user.hire_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {showActions && !isOwnProfile && (
          <>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                onClick={onConnect}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                onClick={onMessage}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
