import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Vote } from "lucide-react";
import { User } from "@shared/schema";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";
import logoUrl from "@/assets/logo.jpg";

export default function Navigation() {
  const { user } = useAuth() as { user: User | null };
  const { t } = useLanguage();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center ml-12 lg:ml-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 overflow-hidden">
              <img src={logoUrl} alt="PP Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900" data-testid="text-app-title">
              PTC System
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector - always visible */}
            <div>
              <LanguageSelector />
            </div>
            
            {/* Real-time Status Indicator - hidden on small screens */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="indicator-live-status"></div>
              <span className="text-sm text-gray-600">{t("common.active")}</span>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <img 
                className="w-8 h-8 rounded-full bg-primary-100" 
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=1565c0&color=fff`}
                alt="User avatar"
                data-testid="img-user-avatar"
              />
              <span className="hidden sm:block text-sm font-medium text-gray-700" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                className="min-h-[44px] px-2 sm:px-4"
                onClick={async () => {
                  try {
                    await fetch("/api/logout", { method: "POST" });
                    window.location.href = "/login";
                  } catch (error) {
                    console.error("Logout failed:", error);
                    window.location.href = "/login";
                  }
                }}
                data-testid="button-logout"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
