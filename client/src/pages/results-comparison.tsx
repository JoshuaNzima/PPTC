import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  GitCompare,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from "lucide-react";

export default function ResultsComparison() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [constituencyFilter, setConstituencyFilter] = useState("all");
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all");
  const [selectedComparison, setSelectedComparison] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch internal results
  const { data: internalResults } = useQuery({
    queryKey: ["/api/results"],
  });

  // Fetch MEC results
  const { data: mecResults } = useQuery({
    queryKey: ["/api/mec-results"],
  });

  // Fetch constituencies for filter
  const { data: constituencies } = useQuery({
    queryKey: ["/api/constituencies"],
  });

  // Combine and compare results
  const compareResults = () => {
    const internalData = internalResults || [];
    const mecData = mecResults?.mecResults || [];
    
    const comparisons: any[] = [];
    
    // Group by constituency and category for comparison
    const internalByKey: { [key: string]: any } = {};
    const mecByKey: { [key: string]: any } = {};
    
    if (Array.isArray(internalData)) {
      internalData.forEach((result: any) => {
        const constituency = result.pollingCenter?.constituency || result.constituency || 'unknown';
        const pollingCenter = result.pollingCenter?.name || result.pollingCenterId || result.pollingCenter?.id || 'general';
        const category = result.category || 'unknown';
        const key = `${constituency}_${category}_${pollingCenter}`;
        internalByKey[key] = result;
      });
    }
    
    if (Array.isArray(mecData)) {
      mecData.forEach((result: any) => {
        const constituency = result.constituency || 'unknown';
        const pollingCenter = result.pollingCenter || result.pollingCenterId || 'general';
        const category = result.category || 'unknown';
        const key = `${constituency}_${category}_${pollingCenter}`;
        mecByKey[key] = result;
      });
    }
    
    // Create comparisons for all unique keys
    const allKeys = new Set([...Object.keys(internalByKey), ...Object.keys(mecByKey)]);
    
    allKeys.forEach(key => {
      const internal = internalByKey[key];
      const mec = mecByKey[key];
      
      if (internal || mec) {
        const internalTotal = internal?.totalVotes || 0;
        const mecTotal = mec?.totalVotes || 0;
        const difference = Math.abs(internalTotal - mecTotal);
        const baseValue = Math.max(internalTotal, mecTotal);
        const percentageDiff = baseValue > 0 ? ((difference / baseValue) * 100) : 0;
        
        comparisons.push({
          key,
          internal,
          mec,
          constituencyId: internal?.pollingCenter?.constituencyId || internal?.constituencyId || mec?.constituencyId || 'unknown',
          constituencyName: internal?.pollingCenter?.constituency || internal?.constituency || mec?.constituency || 'Unknown Constituency',
          pollingCenterName: internal?.pollingCenter?.name || internal?.pollingCenterName || mec?.pollingCenter || 'Unknown Center',
          category: internal?.category || mec?.category || 'unknown',
          internalTotal,
          mecTotal,
          difference,
          percentageDiff,
          status: getComparisonStatus(internal, mec, difference, percentageDiff),
          hasInternal: !!internal,
          hasMec: !!mec
        });
      }
    });
    
    return comparisons;
  };

  const getComparisonStatus = (internal: any, mec: any, difference: number, percentageDiff: number) => {
    if (!internal && !mec) return 'no_data';
    if (!internal) return 'missing_internal';
    if (!mec) return 'missing_mec';
    if (percentageDiff <= 2) return 'match';
    if (percentageDiff <= 10) return 'minor_discrepancy';
    return 'major_discrepancy';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Match</Badge>;
      case 'minor_discrepancy':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Minor Diff</Badge>;
      case 'major_discrepancy':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Major Diff</Badge>;
      case 'missing_internal':
        return <Badge variant="outline" className="text-orange-700 border-orange-300">Missing Internal</Badge>;
      case 'missing_mec':
        return <Badge variant="outline" className="text-blue-700 border-blue-300">Missing MEC</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDifferenceIcon = (difference: number, internalTotal: number, mecTotal: number) => {
    if (difference === 0) return <Minus className="w-4 h-4 text-gray-400" />;
    if (mecTotal > internalTotal) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const comparisons = compareResults();

  // Filter comparisons
  const filteredComparisons = comparisons.filter((comparison: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                         comparison.constituencyName?.toLowerCase().includes(searchLower) ||
                         comparison.pollingCenterName?.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === "all" || comparison.category === categoryFilter;
    const matchesConstituency = constituencyFilter === "all" || comparison.constituencyId === constituencyFilter;
    const matchesDiscrepancy = discrepancyFilter === "all" || comparison.status === discrepancyFilter;
    return matchesSearch && matchesCategory && matchesConstituency && matchesDiscrepancy;
  });

  // Statistics
  const stats = {
    total: comparisons.length,
    matches: comparisons.filter(c => c.status === 'match').length,
    minorDiscrepancies: comparisons.filter(c => c.status === 'minor_discrepancy').length,
    majorDiscrepancies: comparisons.filter(c => c.status === 'major_discrepancy').length,
    missingInternal: comparisons.filter(c => c.status === 'missing_internal').length,
    missingMec: comparisons.filter(c => c.status === 'missing_mec').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GitCompare className="h-8 w-8" />
            Results Comparison
          </h1>
          <p className="text-gray-600 mt-1">
            Compare internal results with official MEC results to identify discrepancies
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Comparisons</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{stats.matches}</p>
              <p className="text-sm text-gray-600">Perfect Matches</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.minorDiscrepancies}</p>
              <p className="text-sm text-gray-600">Minor Differences</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-700">{stats.majorDiscrepancies}</p>
              <p className="text-sm text-gray-600">Major Differences</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-700">{stats.missingInternal}</p>
              <p className="text-sm text-gray-600">Missing Internal</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.missingMec}</p>
              <p className="text-sm text-gray-600">Missing MEC</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Comparisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search constituency or center..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="president">President</SelectItem>
                <SelectItem value="mp">MP</SelectItem>
                <SelectItem value="councilor">Councilor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={constituencyFilter} onValueChange={setConstituencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by constituency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Constituencies</SelectItem>
                {Array.isArray(constituencies) && constituencies.map((constituency: any) => (
                  <SelectItem key={constituency.id} value={constituency.id}>
                    {constituency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="match">Perfect Matches</SelectItem>
                <SelectItem value="minor_discrepancy">Minor Differences</SelectItem>
                <SelectItem value="major_discrepancy">Major Differences</SelectItem>
                <SelectItem value="missing_internal">Missing Internal</SelectItem>
                <SelectItem value="missing_mec">Missing MEC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Results ({filteredComparisons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComparisons.length === 0 ? (
              <div className="text-center py-12">
                <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons found</h3>
                <p className="text-gray-600">
                  {searchTerm || categoryFilter !== "all" || discrepancyFilter !== "all" 
                    ? "No comparisons match your current filters."
                    : "No results available for comparison."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Location</th>
                      <th className="text-left p-3 font-medium text-gray-700">Category</th>
                      <th className="text-center p-3 font-medium text-gray-700">Internal Votes</th>
                      <th className="text-center p-3 font-medium text-gray-700">MEC Votes</th>
                      <th className="text-center p-3 font-medium text-gray-700">Difference</th>
                      <th className="text-center p-3 font-medium text-gray-700">Status</th>
                      <th className="text-center p-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComparisons.map((comparison, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {comparison.constituencyName}
                            </div>
                            {comparison.pollingCenterName && (
                              <div className="text-sm text-gray-500">
                                {comparison.pollingCenterName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {comparison.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`font-semibold ${comparison.hasInternal ? 'text-gray-900' : 'text-gray-400'}`}>
                            {comparison.hasInternal ? comparison.internalTotal.toLocaleString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`font-semibold ${comparison.hasMec ? 'text-gray-900' : 'text-gray-400'}`}>
                            {comparison.hasMec ? comparison.mecTotal.toLocaleString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getDifferenceIcon(comparison.difference, comparison.internalTotal, comparison.mecTotal)}
                            <span className={`font-medium ${
                              comparison.difference === 0 ? 'text-gray-400' :
                              comparison.difference > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {comparison.difference.toLocaleString()}
                            </span>
                            {comparison.percentageDiff > 0 && (
                              <span className="text-xs text-gray-500">
                                ({comparison.percentageDiff.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(comparison.status)}
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedComparison(comparison);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Detailed Comparison
            </DialogTitle>
          </DialogHeader>
          
          {selectedComparison && (
            <div className="space-y-6">
              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-medium">Constituency:</span> {selectedComparison.constituencyName}</div>
                    <div><span className="font-medium">Polling Center:</span> {selectedComparison.pollingCenterName}</div>
                    <div><span className="font-medium">Category:</span> <Badge variant="outline" className="capitalize">{selectedComparison.category}</Badge></div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedComparison.status)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vote Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Internal Votes:</span>
                      <span className={selectedComparison.hasInternal ? 'text-green-700' : 'text-gray-400'}>
                        {selectedComparison.hasInternal ? selectedComparison.internalTotal.toLocaleString() : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">MEC Votes:</span>
                      <span className={selectedComparison.hasMec ? 'text-blue-700' : 'text-gray-400'}>
                        {selectedComparison.hasMec ? selectedComparison.mecTotal.toLocaleString() : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Difference:</span>
                      <span className={`font-bold ${selectedComparison.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedComparison.difference.toLocaleString()}
                        {selectedComparison.percentageDiff > 0 && (
                          <span className="text-sm ml-1">({selectedComparison.percentageDiff.toFixed(1)}%)</span>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Vote Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Internal Results Details */}
                {selectedComparison.internal && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-700">Internal Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Votes:</span>
                          <span className="font-medium">{selectedComparison.internal.totalVotes?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Invalid Votes:</span>
                          <span className="font-medium">{selectedComparison.internal.invalidVotes?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid Votes:</span>
                          <span className="font-medium">
                            {((selectedComparison.internal.totalVotes || 0) - (selectedComparison.internal.invalidVotes || 0)).toLocaleString()}
                          </span>
                        </div>
                        {selectedComparison.internal.submissionChannel && (
                          <div className="flex justify-between">
                            <span>Submission Channel:</span>
                            <Badge variant="outline">{selectedComparison.internal.submissionChannel}</Badge>
                          </div>
                        )}
                        {selectedComparison.internal.createdAt && (
                          <div className="flex justify-between">
                            <span>Submitted:</span>
                            <span className="text-sm">{new Date(selectedComparison.internal.createdAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedComparison.internal.comments && (
                          <div className="mt-3 p-2 bg-gray-50 rounded">
                            <span className="font-medium">Comments:</span>
                            <p className="text-sm mt-1">{selectedComparison.internal.comments}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* MEC Results Details */}
                {selectedComparison.mec && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-700">MEC Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Votes:</span>
                          <span className="font-medium">{selectedComparison.mec.totalVotes?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Invalid Votes:</span>
                          <span className="font-medium">{selectedComparison.mec.invalidVotes?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid Votes:</span>
                          <span className="font-medium">
                            {((selectedComparison.mec.totalVotes || 0) - (selectedComparison.mec.invalidVotes || 0)).toLocaleString()}
                          </span>
                        </div>
                        {selectedComparison.mec.publishedAt && (
                          <div className="flex justify-between">
                            <span>Published:</span>
                            <span className="text-sm">{new Date(selectedComparison.mec.publishedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedComparison.mec.source && (
                          <div className="flex justify-between">
                            <span>Source:</span>
                            <Badge variant="outline">{selectedComparison.mec.source}</Badge>
                          </div>
                        )}
                        {selectedComparison.mec.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded">
                            <span className="font-medium">Notes:</span>
                            <p className="text-sm mt-1">{selectedComparison.mec.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Analysis Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedComparison.status === 'match' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Perfect Match</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          The internal and MEC results are within acceptable variance (≤2%).
                        </p>
                      </div>
                    )}
                    
                    {selectedComparison.status === 'minor_discrepancy' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Minor Discrepancy</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          There's a {selectedComparison.percentageDiff.toFixed(1)}% difference between results. This may require review.
                        </p>
                      </div>
                    )}
                    
                    {selectedComparison.status === 'major_discrepancy' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-800">Major Discrepancy</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          There's a significant {selectedComparison.percentageDiff.toFixed(1)}% difference between results. This requires immediate investigation.
                        </p>
                      </div>
                    )}
                    
                    {selectedComparison.status === 'missing_internal' && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-800">Missing Internal Result</span>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          No internal result found for this location, but MEC has published results.
                        </p>
                      </div>
                    )}
                    
                    {selectedComparison.status === 'missing_mec' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Missing MEC Result</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Internal result exists but no corresponding MEC result has been published yet.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}