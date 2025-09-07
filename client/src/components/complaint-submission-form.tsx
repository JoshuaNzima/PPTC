import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  titleSchema,
  descriptionSchema,
  optionalPhoneSchema,
  optionalEmailSchema 
} from "@shared/validation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import { 
  MessageSquare,
  AlertTriangle,
  MapPin,
  User,
  Phone,
  Mail,
  Upload,
  Send
} from "lucide-react";

const formSchema = z.object({
  title: titleSchema.min(10, "Title must be at least 10 characters").max(200, "Title must not exceed 200 characters"),
  description: descriptionSchema.min(50, "Description must be at least 50 characters").max(2000, "Description must not exceed 2000 characters"),
  category: z.enum(["voting_irregularity", "result_dispute", "procedural_violation", "fraud_allegation", "technical_issue", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  pollingCenterId: z.string().optional().transform(val => val === "" ? undefined : val),
  constituencyId: z.string().optional().transform(val => val === "" ? undefined : val),
  wardId: z.string().optional().transform(val => val === "" ? undefined : val),
  resultId: z.string().optional().transform(val => val === "" ? undefined : val),
  contactPhone: optionalPhoneSchema,
  contactEmail: optionalEmailSchema,
});

type FormData = z.infer<typeof formSchema>;

const categoryLabels = {
  voting_irregularity: "Voting Irregularity",
  result_dispute: "Result Dispute", 
  procedural_violation: "Procedural Violation",
  fraud_allegation: "Fraud Allegation",
  technical_issue: "Technical Issue",
  other: "Other"
};

const priorityLabels = {
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
  urgent: "Urgent"
};

export default function ComplaintSubmissionForm() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: pollingCenters } = useQuery({
    queryKey: ["/api/polling-centers"],
  });

  const { data: constituencies } = useQuery({
    queryKey: ["/api/constituencies"],
  });

  const { data: results } = useQuery({
    queryKey: ["/api/results"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "voting_irregularity",
      priority: "medium",
      pollingCenterId: "",
      constituencyId: "",
      wardId: "",
      resultId: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value.toString());
        }
      });
      
      // Append contact info as JSON
      const contactInfo = {
        phone: data.contactPhone,
        email: data.contactEmail,
      };
      formData.append('contactInfo', JSON.stringify(contactInfo));
      
      // Append files
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/complaints', {
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
        description: "Complaint submitted successfully. You will be notified of any updates.",
      });
      form.reset();
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Complaint</h1>
          <p className="text-gray-600">Report voting irregularities, result disputes, and other election-related issues</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Brief summary of the issue" 
                        {...field} 
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(priorityLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed information about the issue. Include date, time, location, and any witnesses or evidence."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pollingCenterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Polling Center (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
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

                <FormField
                  control={form.control}
                  name="constituencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Constituency (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select constituency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {constituencies && Array.isArray(constituencies) && (constituencies as any[]).map((constituency: any) => (
                            <SelectItem key={constituency.id} value={constituency.id}>
                              {constituency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="resultId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Result (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select related result if applicable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {results && Array.isArray(results) && (results as any[]).slice(0, 20).map((result: any) => (
                          <SelectItem key={result.id} value={result.id}>
                            {result.pollingCenter?.name || 'Unknown Center'} - {result.category} ({result.totalVotes} votes)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+265 xxx xxx xxx" 
                          {...field} 
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@example.com" 
                          {...field} 
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Evidence (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload photos, documents, or other evidence to support your complaint. 
                  Accepted formats: Images (JPG, PNG) and PDFs.
                </p>
                <FileUpload 
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={5}
                  enableOCR={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setFiles([]);
              }}
              disabled={submitMutation.isPending}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-w-32"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}