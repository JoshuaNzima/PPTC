import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  Plus,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Minus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// MEC result entry schema
const mecResultSchema = z.object({
  constituency: z.string().min(1, "Constituency is required"),
  pollingCenter: z.string().min(1, "Polling center is required"),
  category: z.enum(["president", "mp", "councilor"]),
  candidateVotes: z.array(z.object({
    candidateId: z.string().min(1, "Candidate is required"),
    candidateName: z.string().min(1, "Candidate name is required"),
    partyName: z.string().min(1, "Party name is required"),
    votes: z.number().min(0, "Votes must be non-negative"),
  })),
  totalVotes: z.number().min(0),
  invalidVotes: z.number().min(0),
  mecOfficialName: z.string().min(1, "MEC official name is required"),
  dateReceived: z.string().min(1, "Date received is required").refine((val) => {
    // Ensure it's a valid datetime-local format
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Please enter a valid date and time"),
  notes: z.string().optional(),
});

type MECResultFormData = z.infer<typeof mecResultSchema>;

export default function MECResults() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const form = useForm<MECResultFormData>({
    resolver: zodResolver(mecResultSchema),
    defaultValues: {
      constituency: "",
      pollingCenter: "",
      category: "president",
      candidateVotes: [{ candidateId: "", candidateName: "", partyName: "", votes: 0 }],
      totalVotes: 0,
      invalidVotes: 0,
      mecOfficialName: "",
      dateReceived: new Date().toISOString().slice(0, 16), // Default to current date/time
      notes: ""
    },
  });

  // Fetch MEC results
  const { data: mecResults, isLoading } = useQuery({
    queryKey: ["/api/mec-results"],
  });

  // Fetch constituencies for dropdown
  const { data: constituencies } = useQuery({
    queryKey: ["/api/constituencies"],
  });

  // Fetch polling centers for dropdown
  const { data: pollingCenters } = useQuery({
    queryKey: ["/api/polling-centers"],
  });

  // Fetch candidates for vote entry
  const { data: candidates } = useQuery({
    queryKey: ["/api/candidates"],
  });

  // Fetch political parties for dropdown
  const { data: politicalParties } = useQuery({
    queryKey: ["/api/political-parties"],
  });

  // Create MEC result mutation
  const createMECResultMutation = useMutation({
    mutationFn: async (data: MECResultFormData) => {
      const res = await apiRequest("POST", "/api/mec-results", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mec-results"] });
      toast({
        title: "Success",
        description: "MEC result recorded successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to record MEC result";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MECResultFormData) => {
    // Validate that we have at least one candidate vote
    if (!data.candidateVotes || data.candidateVotes.length === 0 || !data.candidateVotes[0].candidateId) {
      toast({
        title: "Validation Error",
        description: "Please add at least one candidate vote",
        variant: "destructive",
      });
      return;
    }

    // Validate that all candidate votes have valid data
    const invalidVotes = data.candidateVotes.some(vote => !vote.candidateId || vote.votes < 0);
    if (invalidVotes) {
      toast({
        title: "Validation Error", 
        description: "Please ensure all candidate votes are valid",
        variant: "destructive",
      });
      return;
    }

    createMECResultMutation.mutate(data);
  };

  const addCandidateVote = () => {
    const currentVotes = form.getValues("candidateVotes");
    form.setValue("candidateVotes", [...currentVotes, { candidateId: "", candidateName: "", partyName: "", votes: 0 }]);
  };

  const removeCandidateVote = (index: number) => {
    const currentVotes = form.getValues("candidateVotes");
    if (currentVotes.length > 1) {
      form.setValue("candidateVotes", currentVotes.filter((_, i) => i !== index));
    }
  };

  // Calculate total votes from candidate votes
  const calculateTotalVotes = () => {
    const candidateVotes = form.watch("candidateVotes") || [];
    const total = candidateVotes.reduce((sum, vote) => sum + (vote.votes || 0), 0);
    form.setValue("totalVotes", total);
  };

  const handleCandidateSelection = (candidateId: string, index: number) => {
    const selectedCandidate = (candidates as any[])?.find((c: any) => c.id === candidateId);
    if (selectedCandidate) {
      const currentVotes = form.getValues("candidateVotes");
      const updatedVotes = [...currentVotes];
      updatedVotes[index] = {
        ...updatedVotes[index],
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        partyName: selectedCandidate.party,
      };
      form.setValue("candidateVotes", updatedVotes);
      calculateTotalVotes(); // Recalculate total votes when candidate/party changes
    }
  };

  const getFilteredCandidates = () => {
    const selectedConstituency = form.watch("constituency");
    const selectedCategory = form.watch("category");
    
    if (!candidates) return [];
    
    // For presidential elections, show all candidates regardless of constituency
    if (selectedCategory === "president") {
      return (candidates as any[])?.filter((candidate: any) => candidate.category === "president") || [];
    }
    
    // For MP and councilor elections, filter by constituency
    if (!selectedConstituency) return (candidates as any[])?.filter((candidate: any) => candidate.category === selectedCategory) || [];
    
    return (candidates as any[])?.filter((candidate: any) => 
      candidate.constituency === selectedConstituency && candidate.category === selectedCategory
    ) || [];
  };

  const handleViewResult = (result: any) => {
    setSelectedResult(result);
    setIsViewDialogOpen(true);
  };

  // Filter results
  const filteredResults = (mecResults as any)?.mecResults?.filter((result: any) => {
    const matchesSearch = result.mecReferenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.constituency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.pollingCenter?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || result.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Check if user can record MEC results (admin and supervisor only)
  const canRecordMECResults = ['admin', 'supervisor'].includes((user as any)?.role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading MEC results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            MEC Official Results
          </h1>
          <p className="text-gray-600 mt-1">
            Record and manage results received from Malawi Electoral Commission (MEC)
          </p>
        </div>
        {canRecordMECResults && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Record MEC Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record MEC Official Result</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="constituency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Constituency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select constituency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from(new Set(
                                (pollingCenters as any[])?.map((center: any) => center.constituency) || []
                              )).map((constituency: string) => (
                                <SelectItem key={constituency} value={constituency}>
                                  {constituency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pollingCenter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Polling Center</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select polling center" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(pollingCenters as any[])
                                ?.filter((center: any) =>
                                  !form.watch("constituency") || center.constituency === form.watch("constituency")
                                )
                                .map((center: any) => (
                                  <SelectItem key={center.id} value={center.name}>
                                    {center.code} - {center.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Election Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="president">President</SelectItem>
                              <SelectItem value="mp">MP</SelectItem>
                              <SelectItem value="councilor">Councilor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateReceived"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time Received</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local" 
                              className="w-full"
                              max={new Date().toISOString().slice(0, 16)} // Prevent future dates
                            />
                          </FormControl>
                          <FormDescription>
                            When did you receive these results from MEC?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* MEC Official Information */}
                  <FormField
                    control={form.control}
                    name="mecOfficialName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MEC Official Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Name of MEC official who provided the results" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Candidate Votes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Candidate Votes</h3>
                      <Button type="button" variant="outline" onClick={addCandidateVote}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Candidate
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {form.watch("candidateVotes")?.map((vote, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Candidate</label>
                            <Select
                              value={vote.candidateId}
                              onValueChange={(value) => handleCandidateSelection(value, index)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select candidate" />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredCandidates().map((candidate: any) => (
                                  <SelectItem key={candidate.id} value={candidate.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{candidate.name}</span>
                                      <span className="text-xs text-gray-500">
                                        ({(politicalParties as any[])?.find((p: any) =>
                                          p.id === candidate.partyId || p.name === candidate.party
                                        )?.abbreviation || candidate.party})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Party</label>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border min-h-[2.5rem]">
                              {vote.partyName && (
                                <>
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: (politicalParties as any[])?.find((p: any) =>
                                        p.name === vote.partyName
                                      )?.color || '#6B7280'
                                    }}
                                  />
                                  <span className="text-sm">{vote.partyName}</span>
                                </>
                              )}
                              {!vote.partyName && (
                                <span className="text-sm text-gray-400">Select candidate first</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Votes</label>
                            <Input
                              type="number"
                              {...form.register(`candidateVotes.${index}.votes`, {
                                valueAsNumber: true,
                                onChange: calculateTotalVotes
                              })}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex items-end">
                            {form.watch("candidateVotes").length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCandidateVote(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vote Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalVotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Valid Votes</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" readOnly className="bg-gray-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invalidVotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invalid Votes</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any additional notes about this MEC result..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMECResultMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {createMECResultMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                          Recording...
                        </>
                      ) : (
                        "Record Result"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total MEC Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Presidential</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredResults.filter((r: any) => r.category === 'president').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">MP Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredResults.filter((r: any) => r.category === 'mp').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Councilor</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredResults.filter((r: any) => r.category === 'councilor').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by reference number, constituency, or center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="president">President</SelectItem>
                <SelectItem value="mp">MP</SelectItem>
                <SelectItem value="councilor">Councilor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>MEC Results ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No MEC results found</h3>
                <p className="text-gray-600">
                  {searchTerm || categoryFilter !== "all"
                    ? "No results match your current filters."
                    : "No MEC results have been recorded yet."
                  }
                </p>
              </div>
            ) : (
              filteredResults.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {result.mecReferenceNumber}
                        </h3>
                        <Badge variant="default" className="capitalize">
                          {result.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Constituency:</strong> {result.constituency}</p>
                        <p><strong>Polling Center:</strong> {result.pollingCenter}</p>
                        <p><strong>Total Votes:</strong> {result.totalVotes}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Received: {result.dateReceived ? format(new Date(result.dateReceived), 'MMM dd, yyyy') : 'Unknown'}
                        </span>
                        <span>MEC Official: {result.mecOfficialName}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResult(result)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Result Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              MEC Result Details
            </DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Reference Number:</span>
                  <p className="text-gray-900">{selectedResult.mecReferenceNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <Badge variant="default" className="capitalize ml-2">
                    {selectedResult.category}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Constituency:</span>
                  <p className="text-gray-900">{selectedResult.constituency}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Polling Center:</span>
                  <p className="text-gray-900">{selectedResult.pollingCenter}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">MEC Official:</span>
                  <p className="text-gray-900">{selectedResult.mecOfficialName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date Received:</span>
                  <p className="text-gray-900">
                    {selectedResult.dateReceived ? format(new Date(selectedResult.dateReceived), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Candidate Votes */}
              {selectedResult.candidateVotes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Candidate Votes:</h4>
                  <div className="space-y-2">
                    {selectedResult.candidateVotes.map((vote: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{vote.candidateName}</span>
                          <span className="text-gray-500 ml-2">({vote.partyName})</span>
                        </div>
                        <Badge variant="outline">{vote.votes.toLocaleString()} votes</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                <div>
                  <span className="font-medium text-gray-700">Total Valid Votes:</span>
                  <p className="text-gray-900 font-semibold">{selectedResult.totalVotes?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Invalid Votes:</span>
                  <p className="text-gray-900 font-semibold">{selectedResult.invalidVotes?.toLocaleString()}</p>
                </div>
              </div>

              {selectedResult.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">{selectedResult.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}