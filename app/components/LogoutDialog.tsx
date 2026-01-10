// src/components/LogoutDialog.tsx
import { useState } from "react"; // Add this import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
}

export function LogoutDialog({
  open,
  onOpenChange,
  onLogout,
}: LogoutDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <LogOut className="h-6 w-6" />
            Log Out
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You'll need to sign in again to
            access your account.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            You will be redirected to the login page after logging out.
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? "Logging out..." : "Log Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
