import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Shield, Edit, Trash2, ToggleLeft, ToggleRight, Eye, Upload, Image, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPoliticalPartySchema, insertCandidateSchema } from "@shared/schema";
import type { PoliticalParty, Candidate } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  nameSchema, 
  abbreviationSchema, 
  colorSchema, 
  descriptionSchema, 
  urlSchema 
} from "@shared/validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: nameSchema,
  abbreviation: abbreviationSchema,
  color: colorSchema.optional(),
  description: descriptionSchema.optional().or(z.literal("")),
  logoUrl: urlSchema.or(z.literal("")),
});

const candidateFormSchema = z.object({
  name: nameSchema,
  abbreviation: abbreviationSchema,
  partyId: z.string().min(1, "Party is required"),
  party: z.string().min(1, "Party name is required"),
  category: z.enum(["president", "mp", "councilor"]),
  constituency: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export function PoliticalPartiesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PoliticalParty | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PoliticalParty | null>(null);
  const itemsPerPage = 12;
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      color: "#3B82F6",
      description: "",
      logoUrl: "",
    },
  });

  const candidateForm = useForm<z.infer<typeof candidateFormSchema>>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      partyId: "",
      party: "",
      category: "mp" as const,
      constituency: "",
      isActive: true,
    },
  });

  const { data: parties, isLoading } = useQuery({
    queryKey: ["/api/political-parties"],
  });

  const { data: candidates } = useQuery({
    queryKey: ["/api/candidates"],
  });

  const { data: constituencies } = useQuery({
    queryKey: ["/api/constituencies"],
  });

  const getCandidateCount = (partyId: string, partyName: string) => {
    if (!candidates) return 0;
    return (candidates as any[]).filter((candidate: any) => 
      candidate.partyId === partyId || candidate.party === partyName
    ).length;
  };

  // Pagination logic
  const totalPages = parties ? Math.ceil((parties as any[]).length / itemsPerPage) : 0;
  const paginatedParties = parties 
    ? (parties as any[]).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const createPartyMutation = useMutation({
    mutationFn: async (partyData: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/political-parties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create political party");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/political-parties"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Political party created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePartyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      const response = await fetch(`/api/political-parties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update political party");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/political-parties"] });
      form.reset();
      setIsDialogOpen(false);
      setEditingParty(null);
      toast({
        title: "Success",
        description: "Political party updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deactivatePartyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/political-parties/${id}/deactivate`, {
        method: "PUT",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deactivate political party");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/political-parties"] });
      toast({
        title: "Success",
        description: "Political party deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactivatePartyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/political-parties/${id}/reactivate`, {
        method: "PUT",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reactivate political party");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/political-parties"] });
      toast({
        title: "Success",
        description: "Political party reactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePartyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/political-parties/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete political party");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/political-parties"] });
      toast({
        title: "Success",
        description: "Political party deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof candidateFormSchema>) => {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create candidate");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      candidateForm.reset();
      setCandidateDialogOpen(false);
      toast({
        title: "Success",
        description: "Candidate created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingParty) {
      updatePartyMutation.mutate({ id: editingParty.id, data: values });
    } else {
      createPartyMutation.mutate(values);
    }
  };

  const onCandidateSubmit = (values: z.infer<typeof candidateFormSchema>) => {
    // Set the party name automatically based on selected party
    const selectedPartyData = (parties as any[])?.find(p => p.id === values.partyId);
    const candidateData = {
      ...values,
      party: selectedPartyData?.name || values.party,
    };
    createCandidateMutation.mutate(candidateData);
  };

  const handleEdit = (party: PoliticalParty) => {
    setEditingParty(party);
    form.reset({
      name: party.name,
      abbreviation: party.abbreviation || "",
      color: party.color || "#3B82F6",
      description: party.description || "",
      logoUrl: (party as any).logoUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeactivate = (party: PoliticalParty) => {
    if (confirm(`Are you sure you want to deactivate "${party.name}"? This will prevent it from being used in new submissions.`)) {
      deactivatePartyMutation.mutate(party.id);
    }
  };

  const handleReactivate = (party: PoliticalParty) => {
    reactivatePartyMutation.mutate(party.id);
  };

  const handleDelete = (party: PoliticalParty) => {
    if (confirm(`Are you sure you want to permanently delete "${party.name}"? This action cannot be undone and will only work if no candidates are using this party.`)) {
      deletePartyMutation.mutate(party.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Political Parties</h1>
            <p className="text-muted-foreground">
              Manage political parties for election consistency
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} data-testid={`party-skeleton-${i}`}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Political Parties</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage political parties for election consistency
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm" data-testid="button-add-party">
                <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                Add Party
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-party">
            <DialogHeader>
              <DialogTitle>{editingParty ? "Edit Political Party" : "Add Political Party"}</DialogTitle>
              <DialogDescription>
                {editingParty ? "Update the political party information" : "Create a new political party for consistent candidate management"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Democratic Progressive Party"
                          {...field}
                          data-testid="input-party-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="abbreviation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abbreviation</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., DPP"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-party-abbreviation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            className="w-16 h-10 p-1 border rounded"
                            {...field}
                            data-testid="input-party-color"
                          />
                          <Input
                            placeholder="#3B82F6"
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1"
                            data-testid="input-party-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the political party..."
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-party-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Logo (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            placeholder="https://example.com/logo.png or leave blank"
                            {...field}
                            data-testid="input-party-logo"
                          />
                          {field.value ? (
                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                              <img 
                                src={field.value} 
                                alt="Party logo preview" 
                                className="w-12 h-12 object-contain rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/api/placeholder/64/64';
                                }}
                              />
                              <div className="text-sm text-gray-600">
                                Logo preview
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Image className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="text-sm text-gray-500">
                                No logo - will use default placeholder
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingParty(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-party"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPartyMutation.isPending || updatePartyMutation.isPending}
                    data-testid="button-save-party"
                  >
                    {editingParty 
                      ? (updatePartyMutation.isPending ? "Updating..." : "Update Party")
                      : (createPartyMutation.isPending ? "Creating..." : "Create Party")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            className="flex-1 sm:flex-initial h-10 text-sm"
            onClick={() => setViewMode('card')}
            data-testid="button-card-view"
          >
            <Grid className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Cards</span>
            <span className="sm:hidden">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className="flex-1 sm:flex-initial h-10 text-sm"
            onClick={() => setViewMode('list')}
            data-testid="button-list-view"
          >
            <List className="h-4 w-4 mr-1 sm:mr-2" />
            List
          </Button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedParties.map((party: PoliticalParty) => (
          <Card key={party.id} className="touch-none" data-testid={`card-party-${party.id}`}>
            <CardHeader className="space-y-0 pb-3 p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="truncate text-base sm:text-lg pr-2">{party.name}</span>
                {party.abbreviation && (
                  <Badge
                    style={{ backgroundColor: party.color || "#6B7280" }}
                    className="text-white w-fit text-xs"
                    data-testid={`badge-abbreviation-${party.id}`}
                  >
                    {party.abbreviation}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {party.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                  {party.description}
                </p>
              )}
              {/* Mobile-First Party Logo */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                {(party as any).logoUrl ? (
                  <img 
                    src={(party as any).logoUrl} 
                    alt={`${party.name} logo`}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded border flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/40/40';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                    <Image className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {getCandidateCount(party.id, party.name)} candidate{getCandidateCount(party.id, party.name) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: party.color || '#6B7280' }}
                    />
                    <span className={`truncate ${party.isActive ? "text-green-600" : "text-red-600"}`}>
                      {party.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile-First Action Buttons */}
              <div className="border-t border-gray-100 pt-3 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedParty(party);
                      setCandidatesModalOpen(true);
                    }}
                    data-testid={`button-view-details-${party.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs"
                    onClick={() => handleEdit(party)}
                    data-testid={`button-edit-${party.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  {party.isActive ? (
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => handleDeactivate(party)}
                      disabled={deactivatePartyMutation.isPending}
                      data-testid={`button-deactivate-${party.id}`}
                    >
                      <ToggleLeft className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Disable</span>
                      <span className="sm:hidden">Off</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleReactivate(party)}
                      disabled={reactivatePartyMutation.isPending}
                      data-testid={`button-reactivate-${party.id}`}
                    >
                      <ToggleRight className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Enable</span>
                      <span className="sm:hidden">On</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => handleDelete(party)}
                    disabled={deletePartyMutation.isPending}
                    data-testid={`button-delete-${party.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Del</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedParties.map((party: PoliticalParty) => (
            <Card key={party.id} className="p-3 sm:p-4" data-testid={`row-party-${party.id}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: party.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{party.name}</div>
                    {party.abbreviation && (
                      <div className="text-xs sm:text-sm text-muted-foreground">{party.abbreviation}</div>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {getCandidateCount(party.id, party.name)} candidates
                  </div>
                </div>
                
                {/* Mobile List Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setEditingParty(party);
                      form.reset({
                        name: party.name,
                        abbreviation: party.abbreviation || "",
                        description: party.description || "",
                        color: party.color || "#6B7280",
                        logoUrl: (party as any).logoUrl || "",
                      });
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-list-${party.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={party.isActive ? "destructive" : "default"}
                    className="flex-1 h-8 text-xs"
                    onClick={() => party.isActive ? handleDeactivate(party) : handleReactivate(party)}
                    disabled={party.isActive ? deactivatePartyMutation.isPending : reactivatePartyMutation.isPending}
                    data-testid={`button-toggle-list-${party.id}`}
                  >
                    {party.isActive ? (
                      <>
                        <ToggleLeft className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Disable</span>
                        <span className="sm:hidden">Off</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Enable</span>
                        <span className="sm:hidden">On</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deletePartyMutation.mutate(party.id)}
                    disabled={deletePartyMutation.isPending}
                    data-testid={`button-delete-list-${party.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Del</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile-First Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
          <Button
            variant="outline"
            className="h-10 px-3 sm:px-4 text-sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="h-10 px-3 sm:px-4 text-sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {(parties as any[]) && (parties as any[]).length === 0 && (
        <Card data-testid="empty-parties">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              No Political Parties
            </CardTitle>
            <CardDescription>
              Get started by creating your first political party. This will help maintain
              consistency when adding candidates and submitting results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-first-party">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Party
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Candidates Modal */}
      <Dialog open={candidatesModalOpen} onOpenChange={setCandidatesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedParty?.name} Candidates
            </DialogTitle>
            <DialogDescription>
              Breakdown of all candidates registered under {selectedParty?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedParty && (
            <div className="space-y-6">
              {/* Party Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(selectedParty as any).logoUrl ? (
                        <img 
                          src={(selectedParty as any).logoUrl} 
                          alt={`${selectedParty.name} logo`}
                          className="w-12 h-12 object-contain rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/48/48';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{selectedParty.name}</h3>
                        {selectedParty.abbreviation && (
                          <Badge 
                            style={{ backgroundColor: selectedParty.color || "#6B7280" }}
                            className="text-white text-xs"
                          >
                            {selectedParty.abbreviation}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {getCandidateCount(selectedParty.id, selectedParty.name)}
                      </div>
                      <div className="text-sm text-gray-600">Total Candidates</div>
                    </div>
                  </div>
                  {selectedParty.description && (
                    <p className="mt-3 text-sm text-gray-700">{selectedParty.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Add Candidate Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    candidateForm.reset({
                      name: "",
                      abbreviation: "",
                      partyId: selectedParty.id,
                      party: selectedParty.name,
                      category: "mp",
                      constituency: "",
                      isActive: true,
                    });
                    setCandidateDialogOpen(true);
                  }}
                  data-testid="button-add-candidate"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </div>

              {/* Candidates Breakdown */}
              {candidates && (
                <div className="space-y-4">
                  {['president', 'mp', 'councilor'].map(category => {
                    const categoryCandidates = (candidates as any[]).filter((candidate: any) => 
                      (candidate.partyId === selectedParty.id || candidate.party === selectedParty.name) &&
                      candidate.category === category
                    );

                    if (categoryCandidates.length === 0) return null;

                    return (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg capitalize flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {category === 'mp' ? 'Member of Parliament' : category.charAt(0).toUpperCase() + category.slice(1)} 
                            <Badge variant="secondary">{categoryCandidates.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3">
                            {categoryCandidates.map((candidate: any) => (
                              <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {candidate.name}
                                    {candidate.abbreviation && (
                                      <Badge variant="outline" className="text-xs">
                                        {candidate.abbreviation}
                                      </Badge>
                                    )}
                                  </div>
                                  {candidate.constituency && (
                                    <div className="text-sm text-gray-600">{candidate.constituency}</div>
                                  )}
                                </div>
                                <Badge variant={candidate.isActive ? "default" : "secondary"}>
                                  {candidate.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {getCandidateCount(selectedParty.id, selectedParty.name) === 0 && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No candidates registered for this party yet.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent data-testid="dialog-add-candidate">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>
              Add a new candidate to {selectedParty?.name || 'this party'}
            </DialogDescription>
          </DialogHeader>
          <Form {...candidateForm}>
            <form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)} className="space-y-4">
              <FormField
                control={candidateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Doe"
                        {...field}
                        data-testid="input-candidate-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={candidateForm.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., JD (for USSD quick entry)"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-candidate-abbreviation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={candidateForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-candidate-category">
                          <SelectValue placeholder="Select candidate category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="president">President</SelectItem>
                        <SelectItem value="mp">Member of Parliament</SelectItem>
                        <SelectItem value="councilor">Councilor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={candidateForm.control}
                name="constituency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Constituency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-candidate-constituency">
                          <SelectValue placeholder="Select constituency (for MP/Councilor)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(constituencies as any[])?.map((constituency: any) => (
                          <SelectItem key={constituency.id} value={constituency.name}>
                            {constituency.name}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidateDialogOpen(false)}
                  data-testid="button-cancel-candidate"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCandidateMutation.isPending}
                  data-testid="button-submit-candidate"
                >
                  {createCandidateMutation.isPending ? "Creating..." : "Create Candidate"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}