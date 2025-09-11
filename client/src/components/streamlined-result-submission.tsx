import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, MapPin, Users, FileText, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, Upload, Save, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";

interface PollingCenter {
  id: string;
  name: string;
  code: string;
  constituency: string;
  district: string;
  registeredVoters: number;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  category: string;
  constituency?: string;
  runningMateName?: string;
}

const STEPS = {
  SELECT_CENTER: 1,
  SELECT_CATEGORY: 2,
  ENTER_VOTES: 3,
  UPLOAD_DOCUMENTS: 4,
  REVIEW: 5
};

const formSchema = z.object({
  pollingCenterId: z.string().min(1, "Please select a polling center"),
  category: z.enum(["president", "mp", "councilor"]),
  votes: z.record(z.coerce.number().min(0, "Votes must be 0 or greater")),
  invalidVotes: z.coerce.number().min(0, "Invalid votes must be 0 or greater"),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function StreamlinedResultSubmission() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(STEPS.SELECT_CENTER);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<PollingCenter | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isResubmission, setIsResubmission] = useState(false);
  const [rejectedResultId, setRejectedResultId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check for resubmission parameters in URL or props
  const urlParams = new URLSearchParams(window.location.search);
  const resubmissionId = urlParams.get('resubmit');

  // Initialize resubmission state if URL parameter is present
  useState(() => {
    if (resubmissionId) {
      setIsResubmission(true);
      setRejectedResultId(resubmissionId);
    }
  });

  // Fetch data
  const { data: pollingCenters = [] } = useQuery({
    queryKey: ["/api/polling-centers"],
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pollingCenterId: "",
      category: "president",
      votes: {},
      invalidVotes: 0,
      comments: "",
    },
  });

  const watchedCategory = form.watch("category");

  // Filter polling centers based on search
  const filteredCenters = (pollingCenters as PollingCenter[]).filter((center: PollingCenter) =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter candidates based on category and selected center
  const relevantCandidates = (candidates as Candidate[]).filter((candidate: Candidate) => {
    if (candidate.category !== watchedCategory) return false;
    
    // For MPs and Councilors, filter by constituency
    if ((watchedCategory === "mp" || watchedCategory === "councilor") && selectedCenter) {
      return candidate.constituency === selectedCenter.constituency;
    }
    
    return true;
  });

  // File upload using react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(file => {
        toast({
          variant: "destructive",
          title: "File rejected",
          description: file.errors[0]?.message || "File upload failed"
        });
      });
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      formData.append("pollingCenterId", data.pollingCenterId);
      formData.append("category", data.category);
      formData.append("invalidVotes", data.invalidVotes.toString());
      
      // Format votes based on category
      if (data.category === "president") {
        formData.append("presidentialVotes", JSON.stringify(data.votes));
        formData.append("mpVotes", JSON.stringify({}));
        formData.append("councilorVotes", JSON.stringify({}));
      } else if (data.category === "mp") {
        formData.append("presidentialVotes", JSON.stringify({}));
        formData.append("mpVotes", JSON.stringify(data.votes));
        formData.append("councilorVotes", JSON.stringify({}));
      } else {
        formData.append("presidentialVotes", JSON.stringify({}));
        formData.append("mpVotes", JSON.stringify({}));
        formData.append("councilorVotes", JSON.stringify(data.votes));
      }
      
      if (data.comments) {
        formData.append("comments", data.comments);
      }
      
      // Add resubmission info if applicable
      if (isResubmission && rejectedResultId) {
        formData.append("resubmissionOf", rejectedResultId);
        formData.append("isResubmission", "true");
      }
      
      // Add files
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
        description: isResubmission ? "Results resubmitted successfully" : "Results submitted successfully",
      });
      
      // Reset form and state
      form.reset();
      setFiles([]);
      setCurrentStep(STEPS.SELECT_CENTER);
      setSelectedCenter(null);
      setIsResubmission(false);
      setRejectedResultId(null);
      
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit results",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    // Show confirmation modal instead of directly submitting
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    const formData = form.getValues();
    submitMutation.mutate(formData);
    setShowConfirm(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.REVIEW) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > STEPS.SELECT_CENTER) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / Object.keys(STEPS).length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.SELECT_CENTER:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select Polling Center</h3>
              <p className="text-gray-600 dark:text-gray-300">Choose the polling center you're reporting results for</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by center name, code, constituency, or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-polling-center"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredCenters.map((center: PollingCenter) => (
                <Card 
                  key={center.id}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                    selectedCenter?.id === center.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    setSelectedCenter(center);
                    form.setValue("pollingCenterId", center.id);
                  }}
                  data-testid={`center-${center.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{center.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {center.constituency}, {center.district}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {center.code} • {center.registeredVoters.toLocaleString()} registered voters
                        </p>
                      </div>
                      {selectedCenter?.id === center.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredCenters.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <p className="text-gray-500">No polling centers found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        );

      case STEPS.SELECT_CATEGORY:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select Result Category</h3>
              <p className="text-gray-600 dark:text-gray-300">Choose which election results you're submitting</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {(['president', 'mp', 'councilor'] as const).map((category) => (
                <Card
                  key={category}
                  className={`cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 ${
                    watchedCategory === category ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                  onClick={() => form.setValue("category", category)}
                  data-testid={`category-${category}`}
                >
                  <CardContent className="p-6 text-center">
                    <h4 className="font-semibold capitalize mb-2">{category}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {category === 'president' && 'Presidential Election'}
                      {category === 'mp' && 'Member of Parliament'}
                      {category === 'councilor' && 'Ward Councilor'}
                    </p>
                    {watchedCategory === category && (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case STEPS.ENTER_VOTES:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enter Vote Counts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter the vote counts for {watchedCategory} candidates
              </p>
            </div>

            <div className="space-y-4">
              {relevantCandidates.map((candidate: Candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-2">
                        {/* Presidential candidates with running mates */}
                        {watchedCategory === "president" && candidate.runningMateName ? (
                          <div>
                            <h4 className="font-semibold text-lg">
                              {candidate.name} / {candidate.runningMateName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              President & Vice President
                            </p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-semibold">{candidate.name}</h4>
                            {watchedCategory !== "president" && candidate.constituency && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {candidate.constituency}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{candidate.party}</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {watchedCategory === "president" ? "Presidential" : 
                             watchedCategory === "mp" ? "MP" : "Councilor"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name={`votes.${candidate.id}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vote Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              data-testid={`votes-${candidate.id}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="invalidVotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invalid/Spoiled Votes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            data-testid="invalid-votes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes or observations..."
                            {...field}
                            data-testid="comments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case STEPS.UPLOAD_DOCUMENTS:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload photos or scanned copies of result forms and other verification documents
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-300 hover:border-orange-400'
              }`}
              data-testid="file-dropzone"
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag & drop files here, or click to select files"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports: JPG, PNG, PDF (max 10MB each)
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Uploaded Files ({files.length})</h4>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      data-testid={`remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case STEPS.REVIEW:
        const totalVotes = Object.values(form.getValues("votes") || {}).reduce((sum, votes) => sum + Number(votes), 0);
        const invalidVotes = form.getValues("invalidVotes") || 0;
        const grandTotal = totalVotes + invalidVotes;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please review all information before submitting
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Polling Center</Label>
                  <p className="font-medium">{selectedCenter?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedCenter?.constituency}, {selectedCenter?.district} • Code: {selectedCenter?.code}
                  </p>
                </div>

                <Separator />

                <div>
                  <Label>Category</Label>
                  <p className="font-medium capitalize">{watchedCategory}</p>
                </div>

                <Separator />

                <div>
                  <Label>Vote Breakdown</Label>
                  <div className="space-y-2">
                    {relevantCandidates.map((candidate: Candidate) => {
                      const votes = form.getValues(`votes.${candidate.id}`) || 0;
                      if (votes > 0) {
                        return (
                          <div key={candidate.id} className="flex justify-between">
                            <span>{candidate.name}</span>
                            <Badge variant="outline">{votes} votes</Badge>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div className="flex justify-between font-medium">
                      <span>Invalid Votes</span>
                      <Badge variant="destructive">{invalidVotes} votes</Badge>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Votes</span>
                      <Badge variant="default">{grandTotal} votes</Badge>
                    </div>
                  </div>
                </div>

                {files.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label>Documents</Label>
                      <p className="text-sm">{files.length} file(s) uploaded</p>
                    </div>
                  </>
                )}

                {form.getValues("comments") && (
                  <>
                    <Separator />
                    <div>
                      <Label>Comments</Label>
                      <p className="text-sm">{form.getValues("comments")}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Resubmission Mode Toggle */}
      {!isResubmission && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Need to resubmit rejected results?</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Toggle this if you're correcting previously rejected results.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResubmission(true);
                // You could also add logic here to let them select which rejected result to replace
              }}
              data-testid="enable-resubmission"
            >
              Enable Resubmission Mode
            </Button>
          </div>
        </div>
      )}

      {isResubmission && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Resubmitting Rejected Results</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsResubmission(false);
                setRejectedResultId(null);
              }}
              data-testid="disable-resubmission"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            This submission will replace your previously rejected results.
            {rejectedResultId && ` (ID: ${rejectedResultId})`}
          </p>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Submit Results</h2>
          <Badge variant="outline">Step {currentStep} of {Object.keys(STEPS).length}</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === STEPS.SELECT_CENTER}
              data-testid="prev-step"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < STEPS.REVIEW ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (currentStep === STEPS.SELECT_CENTER && !selectedCenter) ||
                  (currentStep === STEPS.SELECT_CATEGORY && !watchedCategory)
                }
                data-testid="next-step"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-open-confirm"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review & Submit
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent data-testid="dialog-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isResubmission ? "Confirm Resubmission" : "Confirm Results Submission"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please review your submission before confirming. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            {isResubmission && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    This will replace previously rejected results
                  </span>
                </div>
                {rejectedResultId && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Result ID: {rejectedResultId}
                  </p>
                )}
              </div>
            )}

            {/* Polling Center Info */}
            {selectedCenter && (
              <div>
                <h4 className="font-semibold mb-2">Polling Center</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium">{selectedCenter.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedCenter.code} • {selectedCenter.constituency} • {selectedCenter.district}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedCenter.registeredVoters.toLocaleString()} registered voters
                  </p>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <h4 className="font-semibold mb-2">Category</h4>
              <Badge variant="outline" className="capitalize">
                {form.getValues("category")} Results
              </Badge>
            </div>

            {/* Vote Summary */}
            <div>
              <h4 className="font-semibold mb-2">Vote Summary</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                {relevantCandidates.map((candidate: Candidate) => {
                  const votes = form.getValues(`votes.${candidate.id}`) || 0;
                  if (votes > 0) {
                    return (
                      <div key={candidate.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {form.getValues("category") === "president" && candidate.runningMateName 
                              ? `${candidate.name} / ${candidate.runningMateName}` 
                              : candidate.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                            ({candidate.party})
                          </span>
                        </div>
                        <Badge variant="outline">{votes} votes</Badge>
                      </div>
                    );
                  }
                  return null;
                })}
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Invalid Votes</span>
                  <Badge variant="destructive">{form.getValues("invalidVotes") || 0} votes</Badge>
                </div>
                
                <div className="flex justify-between items-center font-bold">
                  <span>Total Votes</span>
                  <Badge variant="default">
                    {Object.values(form.getValues("votes") || {}).reduce((sum: number, votes: any) => sum + Number(votes || 0), 0) + Number(form.getValues("invalidVotes") || 0)} votes
                  </Badge>
                </div>
              </div>
            </div>

            {/* Files */}
            {files.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Documents</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm">{files.length} file(s) uploaded</p>
                  <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <p key={index} className="text-xs text-gray-600 dark:text-gray-300">
                        {file.name} ({Math.round(file.size / 1024)}KB)
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            {form.getValues("comments") && (
              <div>
                <h4 className="font-semibold mb-2">Comments</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm">{form.getValues("comments")}</p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              disabled={submitMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isResubmission ? "Resubmit Results" : "Submit Results"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}