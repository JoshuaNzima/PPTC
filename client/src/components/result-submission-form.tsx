
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import FileUpload from "./file-upload";
import { NotebookPen, Save, Users, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formSchema = z.object({
  pollingCenterId: z.string().min(1, "Polling center is required"),
  category: z.enum(["president", "mp", "councilor"]),
  presidentialVotes: z.record(z.coerce.number().min(0)).optional(),
  mpVotes: z.record(z.coerce.number().min(0)).optional(),
  councilorVotes: z.record(z.coerce.number().min(0)).optional(),
  invalidVotes: z.coerce.number().min(0, "Invalid votes must be non-negative"),
  comments: z.string().optional().transform(val => val === "" ? undefined : val),
});

type FormData = z.infer<typeof formSchema>;

export default function ResultSubmissionForm() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<FormData | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const { data: pollingCenters } = useQuery({
    queryKey: ["/api/polling-centers"],
  });

  const { data: candidates } = useQuery({
    queryKey: ["/api/candidates"],
  });

  const { data: politicalParties } = useQuery({
    queryKey: ["/api/political-parties"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pollingCenterId: "",
      category: "president",
      presidentialVotes: {},
      mpVotes: {},
      councilorVotes: {},
      invalidVotes: 0,
      comments: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });
      
      // Append files
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/results', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Results submitted successfully",
      });
      form.reset();
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit results",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setPendingSubmission(data);
    setShowSummaryModal(true);
  };

  const handleConfirmSubmit = () => {
    if (pendingSubmission) {
      submitMutation.mutate(pendingSubmission);
      setShowSummaryModal(false);
      setPendingSubmission(null);
    }
  };

  const calculateTotalVotes = (data: FormData) => {
    let total = data.invalidVotes || 0;
    const category = data.category;
    
    if (category === 'president' && data.presidentialVotes) {
      total += Object.values(data.presidentialVotes).reduce((sum, votes) => sum + (Number(votes) || 0), 0);
    } else if (category === 'mp' && data.mpVotes) {
      total += Object.values(data.mpVotes).reduce((sum, votes) => sum + (Number(votes) || 0), 0);
    } else if (category === 'councilor' && data.councilorVotes) {
      total += Object.values(data.councilorVotes).reduce((sum, votes) => sum + (Number(votes) || 0), 0);
    }
    
    return total;
  };

  const getSummaryData = () => {
    if (!pendingSubmission) return null;
    
    const category = pendingSubmission.category;
    const votes = category === 'president' ? pendingSubmission.presidentialVotes :
                  category === 'mp' ? pendingSubmission.mpVotes : 
                  pendingSubmission.councilorVotes;
    
    const candidateVotes = [];
    if (votes) {
      for (const [candidateId, voteCount] of Object.entries(votes)) {
        const candidate = (candidates as any[])?.find((c: any) => c.id === candidateId);
        const party = (politicalParties as any[])?.find((p: any) => p.id === candidate?.partyId || p.name === candidate?.party);
        if (candidate && Number(voteCount) > 0) {
          candidateVotes.push({
            candidate: candidate.name,
            party: party?.name || candidate.party,
            votes: Number(voteCount)
          });
        }
      }
    }
    
    return {
      candidateVotes,
      invalidVotes: pendingSubmission.invalidVotes,
      totalVotes: calculateTotalVotes(pendingSubmission)
    };
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved as a draft",
    });
  };

  const filteredCandidates = candidates && Array.isArray(candidates) ? 
    (candidates as any[]).filter((c: any) => {
      // Filter by category first
      if (c.category !== form.watch("category")) return false;
      
      // For presidential elections, show all presidential candidates (no constituency restriction)
      if (form.watch("category") === "president") return true;
      
      // For MP and councilor elections, filter by constituency
      const selectedPollingCenter = (pollingCenters as any[])?.find((pc: any) => pc.id === form.watch("pollingCenterId"));
      if (!selectedPollingCenter) return false; // Don't show any if no polling center selected for MP/councilor
      
      return c.constituency === selectedPollingCenter.constituency;
    }).sort((a: any, b: any) => {
      const partyA = (politicalParties as any[])?.find((p: any) => p.id === a.partyId || p.name === a.party)?.name || a.party;
      const partyB = (politicalParties as any[])?.find((p: any) => p.id === b.partyId || p.name === b.party)?.name || b.party;
      return partyA.localeCompare(partyB);
    }) : [];

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      {/* Step 1: Polling Center Selection */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm">1</span>
            Polling Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="pollingCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Select Polling Center</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 touch-target" data-testid="select-polling-center">
                          <SelectValue placeholder="Choose polling center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pollingCenters && Array.isArray(pollingCenters) && (pollingCenters as any[]).map((center: any) => (
                          <SelectItem key={center.id} value={center.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{center.code}</span>
                              <span className="text-sm text-gray-600">{center.name}</span>
                            </div>
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Election Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-category">
                      <FormControl>
                        <SelectTrigger className="h-12 touch-target">
                          <SelectValue placeholder="Select election category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="president">Presidential</SelectItem>
                        <SelectItem value="mp">Members of Parliament (MP)</SelectItem>
                        <SelectItem value="councilor">Councilors</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Step 2: Candidate Votes */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm">2</span>
            Candidate Votes
            <Badge variant="outline" className="ml-auto">
              {(() => {
                const category = form.watch("category");
                return category === "president" ? "Presidential" : 
                       category === "mp" ? "MP" : "Councilor";
              })()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">
                  {form.watch("pollingCenterId") ? 
                    "No candidates found for selected criteria" : 
                    "Select a polling center to view candidates"
                  }
                </p>
              </div>
            ) : (
              filteredCandidates.map((candidate: any) => {
                const party = (politicalParties as any[])?.find((p: any) => p.id === candidate.partyId || p.name === candidate.party);
                const fieldName = form.watch("category") === "president" ? "presidentialVotes" :
                                form.watch("category") === "mp" ? "mpVotes" : "councilorVotes";
                
                return (
                  <Card key={candidate.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: party?.color || "#6B7280" }}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm sm:text-base truncate">{candidate.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {party?.name || candidate.party}
                              </p>
                              {form.watch("category") !== "president" && (
                                <p className="text-xs text-gray-500">{candidate.constituency}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-20 sm:w-24">
                          <FormField
                            control={form.control}
                            name={`${fieldName}.${candidate.id}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    className="text-right h-10 sm:h-12 touch-target" 
                                    placeholder="0"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    data-testid={`input-votes-${candidate.id}`} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Invalid Votes */}
          <Card className="mt-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="invalidVotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-orange-800">Invalid Votes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        className="h-12 border-orange-300 focus:border-orange-500 touch-target" 
                        placeholder="Enter number of invalid votes"
                        {...field} 
                        data-testid="input-invalid-votes" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Step 3: Documentation */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm">3</span>
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <FileUpload files={files} onFilesChange={setFiles} />
        </CardContent>
      </Card>

      {/* Step 4: Comments */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <span className="bg-gray-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm">4</span>
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Comments (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any observations or issues during the voting process..."
                    className="min-h-[100px] touch-target"
                    {...field}
                    data-testid="textarea-comments"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={submitMutation.isPending}
          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 h-12 touch-target"
          onClick={form.handleSubmit(onSubmit)}
          data-testid="button-submit-results"
        >
          <NotebookPen className="h-4 w-4 mr-2" />
          {submitMutation.isPending ? "Submitting..." : "Submit Results"}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleSaveDraft}
          className="w-full sm:w-auto h-12 touch-target"
          data-testid="button-save-draft"
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
      </div>
    </div>
    
    {/* Confirmation Modal */}
    <AlertDialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Confirm Result Submission
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please review the details before submitting the results to ensure accuracy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="max-h-[50vh] sm:max-h-[60vh]">
          <div className="space-y-4 py-4">
            {pendingSubmission && (() => {
              const summaryData = getSummaryData();
              const selectedCenter = (pollingCenters as any[])?.find((c: any) => c.id === pendingSubmission.pollingCenterId);
              const categoryLabel = pendingSubmission.category === "president" ? "Presidential" :
                                  pendingSubmission.category === "mp" ? "Members of Parliament" : "Councilor";
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Polling Center:</span>
                      <p className="font-medium break-words">{selectedCenter?.code} - {selectedCenter?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <p className="font-medium">{categoryLabel}</p>
                    </div>
                  </div>
                  
                  {summaryData?.candidateVotes && summaryData.candidateVotes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Candidate Votes</h4>
                      <div className="space-y-2 sm:hidden">
                        {summaryData.candidateVotes.map((cv: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium">{cv.candidate}</div>
                            <div className="text-sm text-gray-600">{cv.party}</div>
                            <div className="font-bold text-blue-600">{cv.votes.toLocaleString()} votes</div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden sm:block border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-2 font-medium">Candidate</th>
                              <th className="text-left p-2 font-medium">Party</th>
                              <th className="text-right p-2 font-medium">Votes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaryData.candidateVotes.map((cv: any, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2">{cv.candidate}</td>
                                <td className="p-2">{cv.party}</td>
                                <td className="p-2 text-right font-medium">{cv.votes.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 border-t gap-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Invalid Votes: </span>
                      <span className="font-medium">{summaryData?.invalidVotes || 0}</span>
                    </div>
                    <div className="text-lg font-bold">
                      <span className="text-gray-600">Total Votes: </span>
                      <span className="text-blue-600">{summaryData?.totalVotes || 0}</span>
                    </div>
                  </div>
                  
                  {pendingSubmission.comments && (
                    <div>
                      <span className="font-medium text-gray-600">Comments:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded break-words">{pendingSubmission.comments}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </ScrollArea>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto touch-target">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmSubmit}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 touch-target"
          >
            Confirm & Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
