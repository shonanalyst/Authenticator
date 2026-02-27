import { Outlet, Link, useLocation } from "react-router";
import { Shield, Settings, Home } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-white">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      {/* iOS-style bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-20 px-6">
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-xl transition-colors ${
              location.pathname === "/dashboard"
                ? "bg-blue-100"
                : ""
            }`}>
              <Home className={`h-6 w-6 ${
                location.pathname === "/dashboard"
                  ? "text-blue-600"
                  : "text-gray-400"
              }`} />
            </div>
            <span className={`text-xs ${
              location.pathname === "/dashboard"
                ? "text-blue-600 font-medium"
                : "text-gray-500"
            }`}>
              Codes
            </span>
          </Link>
          
          <Link
            to="/settings"
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-xl transition-colors ${
              location.pathname === "/settings"
                ? "bg-blue-100"
                : ""
            }`}>
              <Settings className={`h-6 w-6 ${
                location.pathname === "/settings"
                  ? "text-blue-600"
                  : "text-gray-400"
              }`} />
            </div>
            <span className={`text-xs ${
              location.pathname === "/settings"
                ? "text-blue-600 font-medium"
                : "text-gray-500"
            }`}>
              Settings
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}