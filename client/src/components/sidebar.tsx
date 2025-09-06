import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Plus, 
  CheckCircle, 
  FileText, 
  Users, 
  History,
  Settings,
  User,
  AlertTriangle,
  Shield,
  Database,
  MessageSquare,
  MessageCircle,
  Building2,
  GitCompare,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/language-context";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const getNavigation = (t: (key: string) => string) => [
  { name: t("nav.dashboard"), href: "/", icon: BarChart3, roles: ["agent", "supervisor", "admin", "observer"] },
  { name: t("nav.submit_results"), href: "/submit-results", icon: Plus, roles: ["agent", "supervisor", "admin"] },
  { name: t("nav.mec_results"), href: "/mec-results", icon: Building2, roles: ["admin", "supervisor", "observer"] },
  { name: t("nav.internal_results"), href: "/internal-results", icon: FileText, roles: ["admin", "supervisor", "observer"] },
  { name: t("nav.results_comparison"), href: "/results-comparison", icon: GitCompare, roles: ["admin", "supervisor", "observer"] },
  { name: t("nav.complaints"), href: "/complaints", icon: MessageSquare, roles: ["agent", "supervisor", "admin", "observer"] },
  { name: t("nav.verify_results"), href: "/verify-results", icon: CheckCircle, roles: ["supervisor", "admin"] },
  { name: t("nav.review_flagged"), href: "/review-flagged", icon: AlertTriangle, roles: ["supervisor", "admin"] },
  { name: t("nav.reports"), href: "/reports", icon: FileText, roles: ["supervisor", "admin", "observer"] },
  { name: t("nav.user_management"), href: "/user-management", icon: Users, roles: ["admin"] },
  { name: t("nav.political_parties"), href: "/political-parties", icon: Shield, roles: ["admin", "supervisor"] },
  { name: t("nav.data_management"), href: "/data-management", icon: Database, roles: ["admin"] },
  { name: t("nav.admin_management"), href: "/admin-management", icon: Settings, roles: ["admin"] },
  { name: t("nav.audit_trail"), href: "/audit-trail", icon: History, roles: ["supervisor", "admin"] },
  { name: t("nav.profile"), href: "/profile", icon: User, roles: ["agent", "supervisor", "admin", "observer"] },
];

function SidebarContent({ onItemClick, collapsed = false }: { onItemClick?: () => void; collapsed?: boolean }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const navigation = getNavigation(t);
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes((user as any)?.role || "agent")
  );

  return (
    <div className={cn("p-4 sm:p-6", collapsed && "px-2")}>
      <div className="space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "group flex items-center px-3 py-3 text-sm sm:text-base font-medium rounded-md transition-colors cursor-pointer min-h-[44px]",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50",
                  collapsed && "justify-center px-2"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={onItemClick}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    collapsed ? "" : "mr-3",
                    isActive ? "text-primary-500" : "text-gray-400"
                  )}
                />
                {!collapsed && item.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              {t("nav.description") || "Navigate through the application sections"}
            </SheetDescription>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onItemClick={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block bg-white shadow-sm h-screen transition-all duration-300",
        desktopCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="h-8 w-8 p-0"
          >
            {desktopCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
        <SidebarContent collapsed={desktopCollapsed} />
      </aside>
    </>
  );
}
