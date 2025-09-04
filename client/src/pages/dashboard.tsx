import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, MessageSquare } from "lucide-react";
import { RealTimeAnalytics } from "@/components/real-time-analytics";
import PartyPerformanceChart from "@/components/party-performance-chart";
import HierarchicalResultsChart from "@/components/hierarchical-results-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
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
            Real-Time Election Center
          </h1>
          <p className="text-gray-600 mt-1">
            Live monitoring and analytics for election results and complaints
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            data-testid="button-refresh-data"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleExportReport}
            data-testid="button-export-report"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Real-Time Analytics Component */}
      <RealTimeAnalytics />

      {/* Balanced Dashboard Layout - Results and Complaints */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Results Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Election Results Overview</span>
                <Badge variant="default">Results</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PartyPerformanceChart />
            </CardContent>
          </Card>
        </div>

        {/* Complaints Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Complaints Overview</span>
                </div>
                <Badge variant="secondary">Complaints</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Complaints Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">
                      {(complaintsData as any)?.total || 0}
                    </div>
                    <div className="text-sm text-red-600">Total Complaints</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">
                      {(complaintsData as any)?.pending || 0}
                    </div>
                    <div className="text-sm text-yellow-600">Under Review</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {(complaintsData as any)?.resolved || 0}
                    </div>
                    <div className="text-sm text-green-600">Resolved</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {(complaintsData as any)?.urgent || 0}
                    </div>
                    <div className="text-sm text-purple-600">Urgent</div>
                  </div>
                </div>

                {/* Recent Complaints */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Recent Complaints</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(complaintsData as any)?.recent && (complaintsData as any).recent.length > 0 ? (
                      (complaintsData as any).recent.slice(0, 5).map((complaint: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex-1 truncate">
                            <div className="font-medium truncate">{complaint.title}</div>
                            <div className="text-gray-500 text-xs">{complaint.category}</div>
                          </div>
                          <Badge 
                            variant={
                              complaint.priority === 'urgent' ? 'destructive' :
                              complaint.priority === 'high' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {complaint.priority}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No complaints submitted yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hierarchical Results Visualization */}
      <HierarchicalResultsChart />
    </div>
  );
}
