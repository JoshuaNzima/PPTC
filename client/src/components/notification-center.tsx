import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Bell, 
  BellRing, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  User, 
  FileText,
  Vote,
  MessageSquare,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "result_submission" | "complaint" | "verification" | "system" | "user_action";
  userId: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  actionUrl?: string;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const categoryIcons = {
  result_submission: Vote,
  complaint: MessageSquare,
  verification: FileText,
  system: Bell,
  user_action: User,
};

const typeColors = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-orange-50 border-orange-200 text-orange-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Check unread count every 10 seconds
  });

  // WebSocket for real-time notifications
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification: Notification) => {
        // Invalidate queries to refresh the notification list
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        
        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === "error" ? "destructive" : "default",
        });
      };

      socket.on("notification", handleNotification);
      return () => socket.off("notification", handleNotification);
    }
  }, [socket, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/mark-all-read", {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "All notifications marked as read",
        description: "Your notification center has been cleared.",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const unreadCountValue = (unreadCount as any)?.count || 0;
  const notificationsList = (notifications as Notification[]) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-10 w-10 p-0"
          data-testid="button-notification-center"
        >
          {unreadCountValue > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCountValue > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCountValue > 99 ? "99+" : unreadCountValue}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md h-[600px] flex flex-col" data-testid="dialog-notification-center">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </span>
            {notificationsList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                Mark all as read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notificationsList.length === 0 ? (
            <Card className="border-dashed" data-testid="empty-notifications">
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No notifications yet</p>
                <p className="text-sm text-gray-500">
                  You'll see updates about results, complaints, and system activities here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notificationsList.map((notification) => {
                const TypeIcon = typeIcons[notification.type];
                const CategoryIcon = categoryIcons[notification.category];
                
                return (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${typeColors[notification.type]} flex-shrink-0`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              data-testid={`button-delete-${notification.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500 capitalize">
                                {notification.category.replace("_", " ")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), { 
                                  addSuffix: true 
                                })}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationCenter;