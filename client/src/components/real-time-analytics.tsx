import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// 🔧 Small utility to prevent crashes
function safeFormatDistanceToNow(t: (key: string) => string, dateValue?: string | number | Date) {
  if (!dateValue) return t("analytics.justNow");
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return t("analytics.justNow");
  return `${formatDistanceToNow(date, { addSuffix: true })}`;
}

export function RealTimeAnalytics() {
  const { t } = useLanguage();
  const { analytics, isConnected, requestAnalytics } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial analytics with 1-second refresh for real-time feel
  const { data: initialAnalytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/analytics"],
    refetchInterval: 1000, // Real-time refresh every 1 second
  });

  // Auto-refresh every second for live analytics
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Use WebSocket analytics if available, otherwise use query data
  const currentAnalytics = analytics || initialAnalytics || {};

  useEffect(() => {
    if (isConnected) {
      requestAnalytics();
      setLastUpdate(new Date());
    }
  }, [isConnected, requestAnalytics]);

  useEffect(() => {
    if (analytics) {
      setLastUpdate(new Date());
    }
  }, [analytics]);

  if (isLoading && !currentAnalytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} data-testid={`analytics-skeleton-${i}`}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = (currentAnalytics as any)?.overview || {};

  return (
    <div className="space-y-6" data-testid="real-time-analytics">
      {/* Connection Status */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          />
          <span className="text-xs sm:text-sm text-muted-foreground">
            {isConnected ? t("analytics.liveUpdatesActive") : t("analytics.connecting")}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("analytics.lastUpdated")}:{" "}
          {lastUpdate ? safeFormatDistanceToNow(t, lastUpdate) : t("analytics.never")}
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-total-centers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.totalCenters")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCenters}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Progress value={stats.completionRate} className="w-full h-1" />
                <span>{(stats.completionRate ?? 0).toFixed(1)}% {t("analytics.reporting")}</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-results-received">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.resultsReceived")}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resultsReceived}</div>
              <p className="text-xs text-muted-foreground">
                +{(currentAnalytics as any)?.recentActivity?.length || 0} {t("analytics.inLastHour")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-verified">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.verified")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.verified}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Progress
                  value={stats.verificationRate}
                  className="w-full h-1"
                />
                <span>
                  {(stats.verificationRate ?? 0).toFixed(1)}% {t("analytics.verified").toLowerCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.pendingReview")}
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(currentAnalytics as any)?.pendingVerifications || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.flagged} {t("analytics.flaggedForAttention")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Submission Trends */}
        {(currentAnalytics as any)?.submissionTrends && (
          <Card data-testid="submission-trends-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("analytics.submissionTrends")}
              </CardTitle>
              <CardDescription>
                {t("analytics.submissionsAndVerificationsByHour")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={(currentAnalytics as any).submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return isNaN(date.getTime())
                        ? value
                        : date.toLocaleTimeString([], { hour: "2-digit" });
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return isNaN(date.getTime())
                        ? value
                        : date.toLocaleString();
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name={t("analytics.submissions")}
                  />
                  <Line
                    type="monotone"
                    dataKey="verifications"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name={t("analytics.verifications")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Performing Centers */}
        {(currentAnalytics as any)?.topCenters && (
          <Card data-testid="top-centers-chart">
            <CardHeader>
              <CardTitle>{t("analytics.topPerformingCenters")}</CardTitle>
              <CardDescription>
                {t("analytics.centersWithHighestSubmissionRates")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(currentAnalytics as any).topCenters}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="pollingCenter.name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="submissionCount"
                    fill="#8884d8"
                    name={t("analytics.submissions")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Feed */}
      {(currentAnalytics as any)?.recentActivity && (
        <Card data-testid="recent-activity-feed">
          <CardHeader>
            <CardTitle>{t("analytics.recentActivity")}</CardTitle>
            <CardDescription>
              {t("analytics.liveFeedOfLatestSubmissions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {((currentAnalytics as any).recentActivity || [])
                .slice(0, 10)
                .map((activity: any, index: number) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between border-b pb-2"
                    data-testid={`activity-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {activity.status === "verified" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {activity.status === "pending" && (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        {activity.status === "flagged" && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {activity.pollingCenter?.name || t("analytics.unknownCenter")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("analytics.by")} {activity.submitter?.firstName || t("analytics.unknown")} {activity.submitter?.lastName || t("analytics.user")} -{" "}
                          {activity.totalVotes || 0} {t("analytics.votes")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <Badge
                        variant={
                          activity.status === "verified"
                            ? "default"
                            : activity.status === "flagged"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {t(`status.${activity.status}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {safeFormatDistanceToNow(t, activity.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
