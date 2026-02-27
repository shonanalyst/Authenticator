import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Shield,
  Bell,
  Moon,
  Smartphone,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("auth_method");
    toast.success("Logged out");
    navigate("/auth");
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("auth_method");
    toast.success("App reset");
    navigate("/onboarding");
  };

  const handleClearData = () => {
    localStorage.removeItem("auth_accounts");
    toast.success("All accounts deleted");
    window.location.reload();
  };

  const handleExportData = () => {
    const accounts = localStorage.getItem("auth_accounts");
    if (accounts) {
      const blob = new Blob([accounts], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `authenticator-backup-${Date.now()}.json`;
      a.click();
      toast.success("Data exported");
    } else {
      toast.error("No data to export");
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your preferences
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Account Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Account</h3>
                  <p className="text-sm text-gray-500">Signed in with email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-gray-700" />
                <h2 className="font-semibold text-gray-900">
                  Security
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Biometric Lock</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Use Face ID or Touch ID
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Auto-lock</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Lock when inactive
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-gray-700" />
                <h2 className="font-semibold text-gray-900">
                  Notifications
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Get notified about codes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Expiration Alerts</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      When codes expire soon
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-5 w-5 text-gray-700" />
                <h2 className="font-semibold text-gray-900">
                  Appearance
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Dark Mode</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Switch to dark theme
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">Compact View</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Smaller card size
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>

          {/* Data & Backup Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-gray-700" />
                <h2 className="font-semibold text-gray-900">
                  Data & Backup
                </h2>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Download className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Export Data</div>
                      <div className="text-sm text-gray-500">
                        Download backup
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-red-600">
                            Clear All Data
                          </div>
                          <div className="text-sm text-gray-500">
                            Delete all accounts
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[340px] rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete all accounts?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your authenticator accounts. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearData}
                        className="bg-red-600 hover:bg-red-700 rounded-2xl"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="p-5 space-y-2">
              <button
                onClick={handleResetOnboarding}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Shield className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">Reset Tutorial</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="font-medium text-red-600">Log Out</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center py-6 text-sm text-gray-500">
            <p>Authenticator v1.0.0</p>
            <p className="mt-1">© 2026 All rights reserved</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
