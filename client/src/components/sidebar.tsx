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
  GitCompare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/language-context";

const getNavigation = (t: (key: string) => string) => [
  { name: t("nav.dashboard"), href: "/", icon: BarChart3, roles: ["agent", "supervisor", "admin", "reviewer", "president", "mp"] },
  { name: t("nav.submit_results"), href: "/submit-results", icon: Plus, roles: ["agent", "supervisor", "admin"] },
  { name: t("nav.mec_results"), href: "/mec-results", icon: Building2, roles: ["admin", "supervisor", "reviewer", "president", "mp"] },
  { name: t("nav.results_comparison"), href: "/results-comparison", icon: GitCompare, roles: ["admin", "supervisor", "reviewer", "president", "mp"] },
  { name: t("nav.complaints"), href: "/complaints", icon: MessageSquare, roles: ["agent", "supervisor", "admin", "reviewer", "president", "mp"] },
  { name: t("nav.verify_results"), href: "/verify-results", icon: CheckCircle, roles: ["supervisor", "admin"] },
  { name: t("nav.review_flagged"), href: "/review-flagged", icon: AlertTriangle, roles: ["reviewer", "admin"] },
  { name: t("nav.reports"), href: "/reports", icon: FileText, roles: ["supervisor", "admin", "reviewer", "president", "mp"] },
  { name: t("nav.user_management"), href: "/user-management", icon: Users, roles: ["admin"] },
  { name: t("nav.political_parties"), href: "/political-parties", icon: Shield, roles: ["admin", "supervisor"] },
  { name: t("nav.data_management"), href: "/data-management", icon: Database, roles: ["admin"] },
  { name: t("nav.admin_management"), href: "/admin-management", icon: Settings, roles: ["admin"] },
  { name: t("nav.audit_trail"), href: "/audit-trail", icon: History, roles: ["supervisor", "admin", "reviewer"] },
  { name: t("nav.profile"), href: "/profile", icon: User, roles: ["agent", "supervisor", "admin", "reviewer", "president", "mp"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const navigation = getNavigation(t);
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes((user as any)?.role || "agent")
  );

  return (
    <aside className="w-64 bg-white shadow-sm h-screen">
      <div className="p-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-primary-500" : "text-gray-400"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
