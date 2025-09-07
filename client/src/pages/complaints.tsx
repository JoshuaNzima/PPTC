import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Plus,
  Search,
  Calendar,
  Upload
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import ComplaintSubmissionForm from "@/components/complaint-submission-form";

export default function Complaints() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isDismissDialogOpen, setIsDismissDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Fetch complaints data - disable auto-refresh when forms are open
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["/api/complaints"],
    refetchInterval: (isSubmitDialogOpen || isEscalateDialogOpen || isViewDialogOpen || isResolveDialogOpen || isDismissDialogOpen) ? false : 30000, // Disable auto-refresh when forms are open
    refetchIntervalInBackground: false,
  });

  // Mock data for demonstration - replace with actual API call
  const complaints = complaintsData?.complaints || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'under_review':
        return <Badge variant="default"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      case 'escalated_to_mec':
        return <Badge variant="default" className="text-blue-700 border-blue-300"><AlertTriangle className="w-3 h-3 mr-1" />Escalated to MEC</Badge>;
      case 'mec_investigating':
        return <Badge variant="default" className="text-purple-700 border-purple-300"><Search className="w-3 h-3 mr-1" />MEC Investigating</Badge>;
      case 'mec_resolved':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />MEC Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint: any) => {
    const matchesSearch = complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
    setIsViewDialogOpen(true);
  };

  // Escalate complaint mutation
  const escalateComplaintMutation = useMutation({
    mutationFn: async ({ complaintId, reason }: { complaintId: string; reason: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationReason: reason }),
      });
      if (!response.ok) throw new Error('Failed to escalate complaint');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: "Complaint escalated to MEC successfully",
      });
      setIsEscalateDialogOpen(false);
      setEscalationReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to escalate complaint",
        variant: "destructive",
      });
    },
  });

  const handleEscalateComplaint = () => {
    if (!selectedComplaint || !escalationReason.trim()) return;
    escalateComplaintMutation.mutate({
      complaintId: selectedComplaint.id,
      reason: escalationReason,
    });
  };

  // Resolve/Dismiss complaint mutation
  const updateComplaintStatusMutation = useMutation({
    mutationFn: async ({ complaintId, action, resolutionNotes }: { complaintId: string; action: 'resolve' | 'dismiss'; resolutionNotes: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolutionNotes }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} complaint`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: `Complaint ${variables.action}d successfully`,
      });
      setIsResolveDialogOpen(false);
      setIsDismissDialogOpen(false);
      setResolutionNotes("");
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: `Failed to ${variables.action} complaint`,
        variant: "destructive",
      });
    },
  });

  const handleResolveComplaint = () => {
    if (!selectedComplaint || !resolutionNotes.trim()) return;
    updateComplaintStatusMutation.mutate({
      complaintId: selectedComplaint.id,
      action: 'resolve',
      resolutionNotes,
    });
  };

  const handleDismissComplaint = () => {
    if (!selectedComplaint || !resolutionNotes.trim()) return;
    updateComplaintStatusMutation.mutate({
      complaintId: selectedComplaint.id,
      action: 'dismiss',
      resolutionNotes,
    });
  };

  // Check if user can submit complaints (agents, supervisors, admins)
  const canSubmitComplaint = ['agent', 'supervisor', 'admin'].includes((user as any)?.role);
  
  // Check if user can escalate complaints (supervisors, admins)
  const canEscalateComplaint = ['supervisor', 'admin'].includes((user as any)?.role);
  
  // Check if user can resolve/dismiss complaints (supervisors, admins)
  const canManageComplaint = ['supervisor', 'admin'].includes((user as any)?.role);
  
  // Check if complaint can be escalated (not already escalated and not resolved)
  const canComplaintBeEscalated = (status: string) => {
    return !['escalated_to_mec', 'mec_investigating', 'mec_resolved', 'resolved', 'dismissed'].includes(status);
  };

  // Check if complaint can be resolved/dismissed (not already resolved/dismissed)
  const canComplaintBeManaged = (status: string) => {
    return !['resolved', 'dismissed'].includes(status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Mobile-First Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="leading-tight">Election Complaints</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Monitor and manage election complaints
            </p>
          </div>
          {canSubmitComplaint && (
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 sm:h-10 text-base sm:text-sm" data-testid="button-submit-complaint">
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  Submit Complaint
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto m-2">
                <DialogHeader>
                  <DialogTitle>Submit New Complaint</DialogTitle>
                </DialogHeader>
                <ComplaintSubmissionForm onSuccess={() => {
                  setIsSubmitDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
                  toast({
                    title: "Success",
                    description: "Complaint submitted successfully",
                  });
                }} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Mobile-First Statistics Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="touch-none">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900" data-testid="text-total-complaints">{complaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="touch-none">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900" data-testid="text-pending-complaints">
                  {complaints.filter((c: any) => c.status === 'pending' || c.status === 'under_review').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="touch-none">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Resolved</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900" data-testid="text-resolved-complaints">
                  {complaints.filter((c: any) => c.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="touch-none col-span-2 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Urgent</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900" data-testid="text-urgent-complaints">
                  {complaints.filter((c: any) => c.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-First Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filter Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 sm:h-10 text-base sm:text-sm"
              data-testid="input-search-complaints"
            />
          </div>
          
          {/* Filter Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm" data-testid="select-priority-filter">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints ({filteredComplaints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                    ? "No complaints match your current filters."
                    : "No complaints have been submitted yet."
                  }
                </p>
              </div>
            ) : (
              filteredComplaints.map((complaint: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-testid={`card-complaint-${index}`}>
                  <div className="space-y-3">
                    {/* Header with title and badges */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg flex-1 min-w-0 pr-2">{complaint.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm sm:text-base line-clamp-2">
                      {complaint.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {complaint.createdAt ? format(new Date(complaint.createdAt), 'MMM dd, yyyy') : 'Unknown date'}
                      </span>
                      <span>Category: {complaint.category}</span>
                      {complaint.constituencyName && (
                        <span>Location: {complaint.constituencyName}</span>
                      )}
                    </div>
                    
                    {/* Mobile-First Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto h-10 text-sm"
                        onClick={() => handleViewComplaint(complaint)}
                        data-testid={`button-view-complaint-${index}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {/* Conditional Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {canEscalateComplaint && canComplaintBeEscalated(complaint.status) && (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto h-10 text-sm text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setIsEscalateDialogOpen(true);
                            }}
                            data-testid={`button-escalate-complaint-${index}`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Escalate to MEC
                          </Button>
                        )}
                        
                        {canManageComplaint && canComplaintBeManaged(complaint.status) && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              className="flex-1 sm:w-auto h-10 text-sm text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setIsResolveDialogOpen(true);
                              }}
                              data-testid={`button-resolve-complaint-${index}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Resolve</span>
                              <span className="sm:hidden">✓</span>
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 sm:w-auto h-10 text-sm text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setIsDismissDialogOpen(true);
                              }}
                              data-testid={`button-dismiss-complaint-${index}`}
                            >
                              <AlertCircle className="h-4 w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Dismiss</span>
                              <span className="sm:hidden">✗</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile-First View Complaint Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto m-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Complaint Details
            </DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedComplaint.status)}
                {getPriorityBadge(selectedComplaint.priority)}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{selectedComplaint.title}</h3>
                <p className="text-gray-600 mt-2">{selectedComplaint.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-600">{selectedComplaint.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <p className="text-gray-600 capitalize">{selectedComplaint.priority}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-600">{selectedComplaint.constituencyName || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <p className="text-gray-600">
                    {selectedComplaint.createdAt ? format(new Date(selectedComplaint.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                  </p>
                </div>
              </div>

              {selectedComplaint.evidenceFiles && selectedComplaint.evidenceFiles.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Evidence Files:</span>
                  <div className="mt-2 space-y-2">
                    {selectedComplaint.evidenceFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="outline" className="text-xs">{file.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalation Information */}
              {selectedComplaint.escalatedToMec && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">MEC Escalation Details</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    {selectedComplaint.escalationReason && (
                      <div>
                        <span className="font-medium">Reason:</span> {selectedComplaint.escalationReason}
                      </div>
                    )}
                    {selectedComplaint.mecReferenceNumber && (
                      <div>
                        <span className="font-medium">MEC Reference:</span> {selectedComplaint.mecReferenceNumber}
                      </div>
                    )}
                    {selectedComplaint.escalatedAt && (
                      <div>
                        <span className="font-medium">Escalated:</span> {format(new Date(selectedComplaint.escalatedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {canEscalateComplaint && selectedComplaint && canComplaintBeEscalated(selectedComplaint.status) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => setIsEscalateDialogOpen(true)}
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Escalate to MEC
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Escalate Complaint Dialog */}
      <Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Escalate to MEC
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will escalate the complaint to the Malawi Electoral Commission (MEC) for further investigation.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Please provide a detailed reason for escalating this complaint to MEC..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEscalateDialogOpen(false);
                  setEscalationReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEscalateComplaint}
                disabled={!escalationReason.trim() || escalateComplaintMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {escalateComplaintMutation.isPending ? "Escalating..." : "Escalate to MEC"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Complaint Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolve Complaint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Mark this complaint as resolved by providing resolution details.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how this complaint was resolved..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsResolveDialogOpen(false);
                  setResolutionNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveComplaint}
                disabled={!resolutionNotes.trim() || updateComplaintStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateComplaintStatusMutation.isPending ? "Resolving..." : "Resolve Complaint"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dismiss Complaint Dialog */}
      <Dialog open={isDismissDialogOpen} onOpenChange={setIsDismissDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Dismiss Complaint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Dismiss this complaint by providing a reason for dismissal.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dismissal Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain why this complaint is being dismissed..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDismissDialogOpen(false);
                  setResolutionNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDismissComplaint}
                disabled={!resolutionNotes.trim() || updateComplaintStatusMutation.isPending}
                variant="destructive"
              >
                {updateComplaintStatusMutation.isPending ? "Dismissing..." : "Dismiss Complaint"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}