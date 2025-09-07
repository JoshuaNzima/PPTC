import { db } from "../db";
import { notifications, users } from "@shared/schema";
import type { InsertNotification, Notification } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { WebSocketServer } from 'ws';

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "result_submission" | "complaint" | "verification" | "system" | "user_action";
  userId: string;
  relatedId?: string;
  actionUrl?: string;
}

class NotificationService {
  private wsServer?: WebSocketServer;

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const notification = await db.insert(notifications).values({
      title: params.title,
      message: params.message,
      type: params.type,
      category: params.category,
      userId: params.userId,
      relatedId: params.relatedId,
      actionUrl: params.actionUrl,
      isRead: false,
    }).returning();

    const createdNotification = notification[0];

    // Send real-time notification via WebSocket
    this.sendRealTimeNotification(createdNotification);

    return createdNotification;
  }

  async getNotificationsByUser(userId: string, limit = 50): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ 
        isRead: true, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    return result.length > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await db.update(notifications)
      .set({ 
        isRead: true, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .returning();

    return result.length;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    return result.length > 0;
  }

  // Helper methods for creating specific notification types
  async notifyResultSubmitted(submitterId: string, resultId: string, pollingCenterName: string) {
    await this.createNotification({
      title: "Result Submitted Successfully",
      message: `Your result submission for ${pollingCenterName} has been received and is now pending verification.`,
      type: "success",
      category: "result_submission",
      userId: submitterId,
      relatedId: resultId,
      actionUrl: `/verify-results?id=${resultId}`,
    });
  }

  async notifyResultVerified(submitterId: string, resultId: string, pollingCenterName: string) {
    await this.createNotification({
      title: "Result Verified",
      message: `Your result submission for ${pollingCenterName} has been verified and approved.`,
      type: "success",
      category: "verification",
      userId: submitterId,
      relatedId: resultId,
      actionUrl: `/results?id=${resultId}`,
    });
  }

  async notifyResultFlagged(submitterId: string, resultId: string, pollingCenterName: string, reason: string) {
    await this.createNotification({
      title: "Result Flagged for Review",
      message: `Your result submission for ${pollingCenterName} has been flagged: ${reason}`,
      type: "warning",
      category: "verification",
      userId: submitterId,
      relatedId: resultId,
      actionUrl: `/submit-results?edit=${resultId}`,
    });
  }

  async notifyComplaintSubmitted(submitterId: string, complaintId: string, title: string) {
    await this.createNotification({
      title: "Complaint Submitted",
      message: `Your complaint "${title}" has been submitted and is under review.`,
      type: "info",
      category: "complaint",
      userId: submitterId,
      relatedId: complaintId,
      actionUrl: `/complaints?id=${complaintId}`,
    });
  }

  async notifyComplaintStatusChanged(submitterId: string, complaintId: string, title: string, newStatus: string) {
    const statusMessages = {
      'under_review': 'is now under review by our team.',
      'resolved': 'has been resolved.',
      'dismissed': 'has been dismissed.',
      'escalated_to_mec': 'has been escalated to the MEC for investigation.',
    };

    await this.createNotification({
      title: "Complaint Status Updated",
      message: `Your complaint "${title}" ${statusMessages[newStatus as keyof typeof statusMessages] || 'status has been updated'}.`,
      type: newStatus === 'resolved' ? "success" : "info",
      category: "complaint",
      userId: submitterId,
      relatedId: complaintId,
      actionUrl: `/complaints?id=${complaintId}`,
    });
  }

  async notifyNewUserRegistration(adminUserIds: string[], newUserName: string, newUserId: string) {
    for (const adminId of adminUserIds) {
      await this.createNotification({
        title: "New User Registration",
        message: `${newUserName} has registered and is pending approval.`,
        type: "info",
        category: "user_action",
        userId: adminId,
        relatedId: newUserId,
        actionUrl: `/user-management?user=${newUserId}`,
      });
    }
  }

  async notifySystemMaintenance(userIds: string[], message: string) {
    for (const userId of userIds) {
      await this.createNotification({
        title: "System Maintenance Notice",
        message,
        type: "warning",
        category: "system",
        userId: userId,
      });
    }
  }

  private sendRealTimeNotification(notification: Notification) {
    if (!this.wsServer) return;

    // Send to specific user via WebSocket
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(JSON.stringify({
            type: 'notification',
            data: notification
          }));
        } catch (error) {
          console.error('Error sending WebSocket notification:', error);
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;