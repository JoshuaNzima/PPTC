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
import { useWebSocket } from "@/hooks/useWebSocket";
import FileUpload from "./file-upload";
import { NotebookPen, Save, Users, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const { requestAnalytics } = useWebSocket();

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
      // Request updated analytics to reflect new submission
      requestAnalytics();
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

  return (
    <>
    <Card className="border shadow-sm">
      <CardHeader className="border-b p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl" data-testid="text-submission-form-title">Submit New Results</CardTitle>
        <p className="text-sm text-gray-600">Enter polling center results and upload verification documents</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">1</span>
                <span className="leading-tight">Polling Center Selection</span>
              </h4>
              <FormField
                control={form.control}
                name="pollingCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-medium">Polling Center</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 sm:h-11 text-sm sm:text-base" data-testid="select-polling-center">
                          <SelectValue placeholder="Select polling center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pollingCenters && Array.isArray(pollingCenters) && (pollingCenters as any[]).map((center: any) => (
                          <SelectItem key={center.id} value={center.id}>
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

            <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">2</span>
                <span className="leading-tight">Election Results Entry</span>
              </h4>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="mb-4 sm:mb-6">
                    <FormLabel className="text-sm sm:text-base font-medium">Election Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-category">
                      <FormControl>
                        <SelectTrigger className="h-12 sm:h-11 text-sm sm:text-base">
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

              {/* Mobile-First Candidate Votes Section */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <h5 className="text-sm sm:text-base font-medium text-gray-800">Candidate Votes</h5>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {(() => {
                      const category = form.watch("category");
                      return category === "president" ? "Presidential" : 
                             category === "mp" ? "MP" : "Councilor";
                    })()}
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[300px] sm:h-[400px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Candidate</TableHead>
                          <TableHead className="text-xs sm:text-sm px-1 sm:px-4">Party</TableHead>
                          {form.watch("category") !== "president" && (
                            <TableHead className="text-xs sm:text-sm px-1 sm:px-4 hidden sm:table-cell">Constituency</TableHead>
                          )}
                          <TableHead className="text-xs sm:text-sm text-right px-2 sm:px-4 w-20 sm:w-24">Votes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates && Array.isArray(candidates) && 
                         (candidates as any[])
                          .filter((c: any) => {
                            // Filter by category first
                            if (c.category !== form.watch("category")) return false;
                            
                            // For presidential elections, show all presidential candidates (no constituency restriction)
                            if (form.watch("category") === "president") return true;
                            
                            // For MP and councilor elections, filter by constituency
                            const selectedPollingCenter = (pollingCenters as any[])?.find((pc: any) => pc.id === form.watch("pollingCenterId"));
                            if (!selectedPollingCenter) return false; // Don't show any if no polling center selected for MP/councilor
                            
                            return c.constituency === selectedPollingCenter.constituency;
                          })
                          .sort((a: any, b: any) => {
                            const partyA = (politicalParties as any[])?.find((p: any) => p.id === a.partyId || p.name === a.party)?.name || a.party;
                            const partyB = (politicalParties as any[])?.find((p: any) => p.id === b.partyId || p.name === b.party)?.name || b.party;
                            return partyA.localeCompare(partyB);
                          })
                          .map((candidate: any) => {
                            const party = (politicalParties as any[])?.find((p: any) => p.id === candidate.partyId || p.name === candidate.party);
                            const fieldName = form.watch("category") === "president" ? "presidentialVotes" :
                                            form.watch("category") === "mp" ? "mpVotes" : "councilorVotes";
                            
                            return (
                              <TableRow key={candidate.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4">
                                  <div className="min-w-0">
                                    <div className="truncate">{candidate.name}</div>
                                    {form.watch("category") !== "president" && (
                                      <div className="text-xs text-gray-500 truncate sm:hidden">
                                        {candidate.constituency}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-1 sm:px-4">
                                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                    <div 
                                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                                      style={{ backgroundColor: party?.color || "#6B7280" }}
                                    />
                                    <span className="text-xs sm:text-sm font-medium truncate">
                                      {party?.abbreviation || party?.name || candidate.party}
                                    </span>
                                  </div>
                                </TableCell>
                                {form.watch("category") !== "president" && (
                                  <TableCell className="text-xs sm:text-sm text-gray-600 px-1 sm:px-4 hidden sm:table-cell">
                                    {candidate.constituency}
                                  </TableCell>
                                )}
                                <TableCell className="text-right px-2 sm:px-4">
                                  <FormField
                                    control={form.control}
                                    name={`${fieldName}.${candidate.id}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            min="0" 
                                            className="w-16 sm:w-20 text-right text-sm" 
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
                                </TableCell>
                              </TableRow>
                            );
                          })
                        }
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>


              </div>
              
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                <FormField
                  control={form.control}
                  name="invalidVotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-medium text-orange-800">Invalid Votes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          className="w-full sm:w-1/3 h-12 text-base sm:text-sm border-orange-300 focus:border-orange-500" 
                          {...field} 
                          data-testid="input-invalid-votes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">3</span>
                <span className="leading-tight">Documentation & Verification</span>
              </h4>
              <FileUpload files={files} onFilesChange={setFiles} />
            </div>

            <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-gray-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">4</span>
                <span className="leading-tight">Additional Information</span>
              </h4>
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-medium">Additional Comments</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any observations or issues during the voting process..."
                        className="min-h-[80px] sm:min-h-[100px] text-base sm:text-sm"
                        {...field}
                        data-testid="textarea-comments"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm bg-primary-500 hover:bg-primary-600"
                data-testid="button-submit-results"
              >
                <NotebookPen className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                {submitMutation.isPending ? "Submitting..." : "Submit Results"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSaveDraft}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                data-testid="button-save-draft"
              >
                <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    {/* Mobile-First Confirmation Modal */}
    <AlertDialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
      <AlertDialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto m-2">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Eye className="h-5 w-5 text-blue-600" />
            Confirm Result Submission
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            Please review the details before submitting the results to ensure accuracy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {pendingSubmission && (() => {
            const summaryData = getSummaryData();
            const selectedCenter = (pollingCenters as any[])?.find((c: any) => c.id === pendingSubmission.pollingCenterId);
            const categoryLabel = pendingSubmission.category === "president" ? "Presidential" :
                                pendingSubmission.category === "mp" ? "Members of Parliament" : "Councilor";
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Polling Center:</span>
                    <p className="font-medium text-xs sm:text-sm">{selectedCenter?.code} - {selectedCenter?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <p className="font-medium">{categoryLabel}</p>
                  </div>
                </div>
                
                {summaryData?.candidateVotes && summaryData.candidateVotes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Candidate Votes</h4>
                    <div className="border rounded-lg overflow-hidden">
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
                
                <div className="flex justify-between items-center pt-2 border-t">
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
                    <p className="text-sm bg-gray-50 p-2 rounded">{pendingSubmission.comments}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmSubmit}
            className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-sm bg-blue-600 hover:bg-blue-700"
          >
            Confirm & Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
