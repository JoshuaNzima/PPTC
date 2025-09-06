import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AreaChart as AreaChartIcon,
  RefreshCw,
  Filter,
  Eye,
} from "lucide-react";

interface ResultData {
  id: string;
  name: string;
  type: 'constituency' | 'ward' | 'center';
  parentId?: string;
  totalVotes: number;
  resultsReceived: number;
  verifiedResults: number;
  pendingResults: number;
  flaggedResults: number;
  completionRate: number;
  verificationRate: number;
  children?: ResultData[];
  partyBreakdown?: Array<{
    party: string;
    votes: number;
    percentage: number;
    color: string;
  }>;
}

type ChartType = 'bar' | 'pie' | 'line' | 'area';
type ViewLevel = 'constituency' | 'ward' | 'center';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

const chartTypeIcons = {
  bar: BarChart3,
  pie: PieChartIcon,
  line: TrendingUp,
  area: AreaChartIcon,
};

const chartTypeLabels = {
  bar: 'Bar Chart',
  pie: 'Pie Chart', 
  line: 'Line Chart',
  area: 'Area Chart',
};

export default function HierarchicalResultsChart() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('constituency');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [dataView, setDataView] = useState<'results' | 'party_performance'>('results');

  const { data: hierarchicalData, isLoading, refetch } = useQuery({
    queryKey: ["/api/hierarchical-results", viewLevel, selectedItem],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('level', viewLevel);
      if (selectedItem) params.append('parentId', selectedItem);
      return fetch(`/api/hierarchical-results?${params}`, { credentials: "include" }).then(res => res.json());
    },
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  const chartData = useMemo(() => hierarchicalData || [], [hierarchicalData]);

  const handleViewChange = useCallback((newLevel: ViewLevel) => {
    setViewLevel(newLevel);
    setSelectedItem(''); // Reset selection when changing levels
  }, []);

  const handleItemSelection = useCallback((itemId: string) => {
    if (viewLevel === 'constituency') {
      setViewLevel('ward');
      setSelectedItem(itemId);
    } else if (viewLevel === 'ward') {
      setViewLevel('center');
      setSelectedItem(itemId);
    }
  }, [viewLevel]);

  const goBack = useCallback(() => {
    if (viewLevel === 'center') {
      setViewLevel('ward');
    } else if (viewLevel === 'ward') {
      setViewLevel('constituency');
      setSelectedItem('');
    }
  }, [viewLevel]);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            No data available for this view
          </div>
        </div>
      );
    }

    const dataKey = dataView === 'results' ? 'totalVotes' : 'totalVotes';

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} onClick={(data) => data?.activeLabel && handleItemSelection(data.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ResultData;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-blue-600">Total Votes: {data.totalVotes.toLocaleString()}</p>
                        <p className="text-green-600">Verified: {data.verifiedResults}</p>
                        <p className="text-yellow-600">Pending: {data.pendingResults}</p>
                        <p className="text-red-600">Flagged: {data.flaggedResults}</p>
                        <p className="text-gray-600">Completion: {data.completionRate?.toFixed(1)}%</p>
                        <p className="text-purple-600">Verification: {data.verificationRate?.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {chartData.map((entry: ResultData, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, totalVotes, percentage }) => 
                  `${name}: ${totalVotes?.toLocaleString()} (${percentage?.toFixed(1)}%)`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey={dataKey}
                onClick={(data) => handleItemSelection(data.id)}
              >
                {chartData.map((entry: ResultData, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Votes']} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#3B82F6"
                fill="#93C5FD"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hierarchical Results View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">Loading hierarchical data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hierarchical Results View
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* View Level Navigation */}
          <div className="flex items-center gap-2">
            {viewLevel !== 'constituency' && (
              <Button variant="outline" size="sm" onClick={goBack}>
                ← Back
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant={viewLevel === 'constituency' ? 'default' : 'secondary'}>
                Constituency
              </Badge>
              {viewLevel !== 'constituency' && (
                <>
                  <span>→</span>
                  <Badge variant={viewLevel === 'ward' ? 'default' : 'secondary'}>
                    Ward
                  </Badge>
                </>
              )}
              {viewLevel === 'center' && (
                <>
                  <span>→</span>
                  <Badge variant="default">
                    Center
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={dataView} onValueChange={(value: 'results' | 'party_performance') => setDataView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="results">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Results View
                  </div>
                </SelectItem>
                <SelectItem value="party_performance">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Party Performance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(chartTypeLabels).map(([type, label]) => {
                  const Icon = chartTypeIcons[type as ChartType];
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        {useMemo(() => {
          const totalVotes = chartData.reduce((sum: number, item: ResultData) => sum + (item.totalVotes || 0), 0);
          const avgCompletion = chartData.length > 0 
            ? (chartData.reduce((sum: number, item: ResultData) => sum + (item.completionRate || 0), 0) / chartData.length).toFixed(1)
            : 0;
          const avgVerification = chartData.length > 0 
            ? (chartData.reduce((sum: number, item: ResultData) => sum + (item.verificationRate || 0), 0) / chartData.length).toFixed(1)
            : 0;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-semibold text-blue-900 text-sm">Total Items</div>
                <div className="text-xl font-bold text-blue-700">{chartData.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-semibold text-green-900 text-sm">Total Votes</div>
                <div className="text-xl font-bold text-green-700">
                  {totalVotes.toLocaleString()}
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="font-semibold text-yellow-900 text-sm">Avg Completion</div>
                <div className="text-xl font-bold text-yellow-700">
                  {avgCompletion}%
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-semibold text-purple-900 text-sm">Avg Verification</div>
                <div className="text-xl font-bold text-purple-700">
                  {avgVerification}%
                </div>
              </div>
            </div>
          );
        }, [chartData])}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {renderChart()}
          
          {/* Click hint */}
          {viewLevel !== 'center' && (
            <p className="text-sm text-gray-500 text-center">
              Click on {viewLevel === 'constituency' ? 'constituencies' : 'wards'} to drill down to the next level
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}