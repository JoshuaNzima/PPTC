import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, MessageSquare } from "lucide-react";
import { RealTimeAnalytics } from "@/components/real-time-analytics";
import PartyPerformanceChart from "@/components/party-performance-chart";
import HierarchicalResultsChart from "@/components/hierarchical-results-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";

export default function Dashboard() {
  const { t } = useLanguage();
  
  // Fetch polling centers for export functionality
  const { data: pollingCenters } = useQuery({
    queryKey: ["/api/polling-centers"],
  });

  // Fetch complaints data for balanced dashboard view
  const { data: complaintsData } = useQuery({
    queryKey: ["/api/complaints/summary"],
    refetchInterval: 5000,
  });

  const handleExportReport = () => {
    // Comprehensive report export functionality
    const data = {
      timestamp: new Date().toISOString(),
      pollingCenters: Array.isArray(pollingCenters) ? pollingCenters.length : 0,
      exportedBy: "Dashboard User",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `election-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshData = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-gray-900"
            data-testid="text-dashboard-title"
          >
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            data-testid="button-refresh-data"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
          <Button
            onClick={handleExportReport}
            data-testid="button-export-report"
          >
            <Download className="mr-2 h-4 w-4" />
            {t("common.export")}
          </Button>
        </div>
      </div>

      {/* Real-Time Analytics Component */}
      <RealTimeAnalytics />

      {/* Election Results Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("dashboard.results_overview")}</span>
            <Badge variant="default">Results</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PartyPerformanceChart />
        </CardContent>
      </Card>
      
      {/* Hierarchical Results Visualization */}
      <HierarchicalResultsChart />
    </div>
  );
}
