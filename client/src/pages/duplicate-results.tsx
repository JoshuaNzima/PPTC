import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Eye, CheckCircle, XCircle, AlertTriangle, Users, Calendar, MapPin } from "lucide-react";

interface DuplicateResult {
  id: string;
  pollingCenterId: string;
  submittedBy: string;
  presidentialVotes: Record<string, number>;
  mpVotes: Record<string, number>;
  councilorVotes: Record<string, number>;
  invalidVotes: number;
  totalVotes: number;
  status: string;
  flaggedReason: string;
  isDuplicate: boolean;
  duplicateGroupId: string;
  duplicateReason: string;
  relatedResultIds: string[];
  createdAt: string;
  pollingCenter: {
    id: string;
    name: string;
    code: string;
    constituency: string;
    district: string;
  };
  submitter: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface DuplicateGroup {
  [groupId: string]: DuplicateResult[];
}

export default function DuplicateResults() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [resolutionReason, setResolutionReason] = useState("");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch duplicate results
  const { data: duplicatesData, isLoading } = useQuery({
    queryKey: ["/api/duplicate-results"],
    queryFn: async (): Promise<{ groups: DuplicateGroup; total: number }> => {
      const response = await fetch("/api/duplicate-results", { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch duplicate results');
      return response.json();
    }
  });

  // Fetch specific group details
  const { data: groupDetails } = useQuery({
    queryKey: ["/api/duplicate-results", selectedGroup],
    queryFn: async (): Promise<DuplicateResult[]> => {
      if (!selectedGroup) return [];
      const response = await fetch(`/api/duplicate-results/${selectedGroup}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch group details');
      return response.json();
    },
    enabled: !!selectedGroup
  });

  // Resolve duplicate mutation
  const resolveDuplicatesMutation = useMutation({
    mutationFn: async ({ groupId, approvedResultId, resolution, reason }: {
      groupId: string;
      approvedResultId: string;
      resolution: string;
      reason: string;
    }) => {
      return apiRequest(`/api/duplicate-results/${groupId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ approvedResultId, resolution, reason })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Duplicate results resolved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/duplicate-results"] });
      setSelectedGroup(null);
      setSelectedResultId(null);
      setResolutionReason("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resolve duplicate results"
      });
    }
  });

  const handleResolve = () => {
    if (!selectedGroup || !selectedResultId || !resolutionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a result to approve and provide a reason"
      });
      return;
    }

    resolveDuplicatesMutation.mutate({
      groupId: selectedGroup,
      approvedResultId: selectedResultId,
      resolution: "resolved",
      reason: resolutionReason
    });
  };

  const formatVotes = (votes: Record<string, number>) => {
    return Object.entries(votes || {}).map(([candidate, count]) => (
      `${candidate}: ${count}`
    )).join(", ");
  };

  const calculateSimilarity = (result1: DuplicateResult, result2: DuplicateResult): number => {
    // Simple similarity calculation based on vote patterns
    const total1 = result1.totalVotes;
    const total2 = result2.totalVotes;
    const diff = Math.abs(total1 - total2);
    const max = Math.max(total1, total2);
    return max > 0 ? ((max - diff) / max) * 100 : 100;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading duplicate results...</p>
          </div>
        </div>
      </div>
    );
  }

  const duplicateGroups = duplicatesData?.groups || {};
  const totalGroups = Object.keys(duplicateGroups).length;

  return (
    <div className="p-6" data-testid="duplicate-results-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Duplicate Results Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Review and resolve duplicate result submissions
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {totalGroups} Duplicate Groups
          </Badge>
          <Badge variant="outline" className="text-sm">
            {duplicatesData?.total || 0} Total Flagged Results
          </Badge>
        </div>
      </div>

      {totalGroups === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Duplicate Results Found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              All submitted results are unique. Great work!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(duplicateGroups).map(([groupId, results]) => (
            <Card key={groupId} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Duplicate Group: {groupId}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {results[0]?.pollingCenter?.name} ({results[0]?.pollingCenter?.constituency})
                        </span>
                        <Badge variant="destructive">{results.length} Conflicting Results</Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setSelectedGroup(groupId)}
                        data-testid={`compare-group-${groupId}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Compare & Resolve
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Compare Duplicate Results - Group {groupId}</DialogTitle>
                        <DialogDescription>
                          Review the conflicting results and select the correct one to approve
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {groupDetails?.map((result, index) => (
                          <Card 
                            key={result.id} 
                            className={`border-2 cursor-pointer transition-colors ${
                              selectedResultId === result.id 
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedResultId(result.id)}
                            data-testid={`result-${result.id}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant={selectedResultId === result.id ? "default" : "outline"}>
                                    Result #{index + 1}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {result.submitter.firstName} {result.submitter.lastName}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(result.createdAt).toLocaleDateString()}
                                  </Badge>
                                </div>
                                {selectedResultId === result.id && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <Label className="font-medium">Presidential Votes</Label>
                                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    {formatVotes(result.presidentialVotes)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-medium">MP Votes</Label>
                                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    {formatVotes(result.mpVotes)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-medium">Councilor Votes</Label>
                                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    {formatVotes(result.councilorVotes)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm border-t pt-3">
                                <span><strong>Total Votes:</strong> {result.totalVotes}</span>
                                <span><strong>Invalid Votes:</strong> {result.invalidVotes}</span>
                                <span><strong>Status:</strong> 
                                  <Badge variant="outline" className="ml-1">{result.status}</Badge>
                                </span>
                              </div>
                              {result.duplicateReason && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-4 border-l-orange-500">
                                  <Label className="font-medium text-orange-800 dark:text-orange-200">
                                    Duplicate Reason:
                                  </Label>
                                  <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                                    {result.duplicateReason}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        
                        <div className="border-t pt-4">
                          <Label htmlFor="resolution-reason" className="text-sm font-medium">
                            Resolution Reason <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="resolution-reason"
                            placeholder="Explain why you selected this result as the correct one..."
                            value={resolutionReason}
                            onChange={(e) => setResolutionReason(e.target.value)}
                            className="mt-1"
                            data-testid="resolution-reason"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedGroup(null);
                              setSelectedResultId(null);
                              setResolutionReason("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleResolve}
                            disabled={!selectedResultId || !resolutionReason.trim() || resolveDuplicatesMutation.isPending}
                            data-testid="resolve-duplicates"
                          >
                            {resolveDuplicatesMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Resolving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Resolve Duplicates
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Duplicate Reason:</strong> {results[0]?.duplicateReason}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.map((result, index) => (
                      <Badge key={result.id} variant="outline" className="text-xs">
                        #{index + 1}: {result.submitter.firstName} {result.submitter.lastName} 
                        ({result.totalVotes} votes)
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}