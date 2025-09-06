import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Eye, FileText, Users, CheckCircle, AlertTriangle, Clock, Filter } from "lucide-react";

interface InternalResult {
  id: string;
  constituency: string;
  pollingCenter: string;
  pollingCenterCode: string;
  category: "president" | "mp" | "councilor";
  status: "pending" | "verified" | "flagged" | "rejected";
  totalVotes: number;
  invalidVotes: number;
  submissionChannel: "portal" | "whatsapp" | "ussd" | "both";
  candidateVotes: Array<{
    candidateId: string;
    votes: number;
    category: string;
  }>;
  submittedBy: string;
  submittedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  flaggedReason?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalResultsResponse {
  internalResults: InternalResult[];
}

export default function InternalResultsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<InternalResult | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: internalResultsData, isLoading, error } = useQuery<InternalResultsResponse>({
    queryKey: ["internal-results"],
    queryFn: async () => {
      const response = await fetch("/api/internal-results", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch internal results");
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const internalResults = internalResultsData?.internalResults || [];

  // Filter results based on search and filters
  const filteredResults = internalResults.filter((result) => {
    const matchesSearch = 
      result.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.pollingCenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.pollingCenterCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || result.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || result.status === selectedStatus;
    const matchesChannel = selectedChannel === "all" || result.submissionChannel === selectedChannel;

    return matchesSearch && matchesCategory && matchesStatus && matchesChannel;
  });

  // Calculate statistics
  const stats = {
    total: internalResults.length,
    verified: internalResults.filter(r => r.status === "verified").length,
    pending: internalResults.filter(r => r.status === "pending").length,
    flagged: internalResults.filter(r => r.status === "flagged").length,
    rejected: internalResults.filter(r => r.status === "rejected").length,
    presidential: internalResults.filter(r => r.category === "president").length,
    mp: internalResults.filter(r => r.category === "mp").length,
    councilor: internalResults.filter(r => r.category === "councilor").length,
    portal: internalResults.filter(r => r.submissionChannel === "portal").length,
    whatsapp: internalResults.filter(r => r.submissionChannel === "whatsapp").length,
    ussd: internalResults.filter(r => r.submissionChannel === "ussd").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "flagged":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Flagged</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-300 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "president":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Presidential</Badge>;
      case "mp":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">MP</Badge>;
      case "councilor":
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Councilor</Badge>;
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "portal":
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Portal</Badge>;
      case "whatsapp":
        return <Badge variant="outline" className="border-green-300 text-green-700">WhatsApp</Badge>;
      case "ussd":
        return <Badge variant="outline" className="border-purple-300 text-purple-700">USSD</Badge>;
      case "both":
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Multiple</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  const openViewDialog = (result: InternalResult) => {
    setSelectedResult(result);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading results</h3>
          <p className="mt-1 text-sm text-gray-500">Failed to fetch internal results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Internal Results</h1>
          <p className="text-gray-600">Results submitted through the portal and other internal channels</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All internal submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Confirmed results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presidential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{stats.presidential}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">{stats.mp}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Councilor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{stats.councilor}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search and Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by constituency, polling center, or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="president">Presidential</SelectItem>
                <SelectItem value="mp">MP</SelectItem>
                <SelectItem value="councilor">Councilor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="ussd">USSD</SelectItem>
                <SelectItem value="both">Multiple</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Results ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedChannel !== "all"
                  ? "Try adjusting your search filters."
                  : "No internal results have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Polling Center
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.pollingCenter}</div>
                        <div className="text-sm text-gray-500">{result.constituency}</div>
                        <div className="text-xs text-gray-400">{result.pollingCenterCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(result.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(result.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getChannelBadge(result.submissionChannel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Total: {result.totalVotes}
                        </div>
                        <div className="text-sm text-red-600">
                          Invalid: {result.invalidVotes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.submittedBy}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(result)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Result Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Internal Result Details</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Polling Center Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedResult.pollingCenter}</div>
                    <div><span className="font-medium">Code:</span> {selectedResult.pollingCenterCode}</div>
                    <div><span className="font-medium">Constituency:</span> {selectedResult.constituency}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Submission Details</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Category:</span> {getCategoryBadge(selectedResult.category)}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedResult.status)}</div>
                    <div><span className="font-medium">Channel:</span> {getChannelBadge(selectedResult.submissionChannel)}</div>
                    <div><span className="font-medium">Submitted by:</span> {selectedResult.submittedBy}</div>
                    <div><span className="font-medium">Submitted:</span> {new Date(selectedResult.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Vote Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Vote Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Votes:</span> {selectedResult.totalVotes}
                  </div>
                  <div>
                    <span className="font-medium">Invalid Votes:</span> {selectedResult.invalidVotes}
                  </div>
                </div>
              </div>

              {/* Candidate Votes */}
              {selectedResult.candidateVotes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Candidate Votes</h4>
                  <div className="space-y-2">
                    {selectedResult.candidateVotes.map((vote, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Candidate {vote.candidateId}</span>
                        <span className="font-medium">{vote.votes} votes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(selectedResult.verifiedBy || selectedResult.flaggedReason || selectedResult.comments) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedResult.verifiedBy && (
                      <div><span className="font-medium">Verified by:</span> {selectedResult.verifiedBy}</div>
                    )}
                    {selectedResult.verifiedAt && (
                      <div><span className="font-medium">Verified:</span> {new Date(selectedResult.verifiedAt).toLocaleString()}</div>
                    )}
                    {selectedResult.flaggedReason && (
                      <div><span className="font-medium">Flagged reason:</span> {selectedResult.flaggedReason}</div>
                    )}
                    {selectedResult.comments && (
                      <div><span className="font-medium">Comments:</span> {selectedResult.comments}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}