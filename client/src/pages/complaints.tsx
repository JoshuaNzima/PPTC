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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Fetch complaints data - disable auto-refresh when forms are open
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["/api/complaints"],
    refetchInterval: (isSubmitDialogOpen || isEscalateDialogOpen || isViewDialogOpen) ? false : 30000, // Disable auto-refresh when forms are open
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

  // Check if user can submit complaints (agents, supervisors, admins)
  const canSubmitComplaint = ['agent', 'supervisor', 'admin'].includes((user as any)?.role);
  
  // Check if user can escalate complaints (supervisors, admins)
  const canEscalateComplaint = ['supervisor', 'admin'].includes((user as any)?.role);
  
  // Check if complaint can be escalated (not already escalated and not resolved)
  const canComplaintBeEscalated = (status: string) => {
    return !['escalated_to_mec', 'mec_investigating', 'mec_resolved', 'resolved'].includes(status);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Election Complaints System
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage election-related complaints and irregularities
          </p>
        </div>
        {canSubmitComplaint && (
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter((c: any) => c.status === 'pending' || c.status === 'under_review').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter((c: any) => c.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter((c: any) => c.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-48">
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
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                    ? "No complaints match your current filters."
                    : "No complaints have been submitted yet."
                  }
                </p>
              </div>
            ) : (
              filteredComplaints.map((complaint: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {complaint.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {complaint.createdAt ? format(new Date(complaint.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                        </span>
                        <span>Category: {complaint.category}</span>
                        {complaint.constituencyName && (
                          <span>Location: {complaint.constituencyName}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewComplaint(complaint)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {canEscalateComplaint && canComplaintBeEscalated(complaint.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsEscalateDialogOpen(true);
                          }}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Escalate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Complaint Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
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

              <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
}