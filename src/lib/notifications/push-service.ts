/**
 * Push Notification Service
 * שליחת Push Notifications דרך Expo Push API
 */

import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import { prisma } from '@/lib/prisma';

// Singleton instance
const expo = new Expo();

export interface PushNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * שליחת Push Notification לכל המכשירים של משתמש
 */
export async function sendPushToUser(params: PushNotificationParams): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const result = { success: false, sent: 0, failed: 0, errors: [] as string[] };

  try {
    // שליפת כל הטוקנים הפעילים של המשתמש
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId: params.userId,
        active: true,
      },
    });

    if (tokens.length === 0) {
      console.log(`📱 No active push tokens for user ${params.userId}`);
      return { ...result, success: true };
    }

    // בניית הודעות
    const messages: ExpoPushMessage[] = [];
    const tokenMap: Map<string, string> = new Map(); // token -> pushTokenId

    for (const tokenRecord of tokens) {
      if (!Expo.isExpoPushToken(tokenRecord.token)) {
        console.warn(`⚠️ Invalid push token: ${tokenRecord.token}, deactivating`);
        await prisma.pushToken.update({
          where: { id: tokenRecord.id },
          data: { active: false },
        });
        continue;
      }

      tokenMap.set(tokenRecord.token, tokenRecord.id);
      messages.push({
        to: tokenRecord.token,
        sound: params.sound ?? 'default',
        title: params.title,
        body: params.body,
        data: params.data || {},
        priority: params.priority || 'high',
        ...(params.badge !== undefined && { badge: params.badge }),
      });
    }

    if (messages.length === 0) {
      return { ...result, success: true };
    }

    // שליחה באצוות
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending push notification chunk:', error);
        result.errors.push(error instanceof Error ? error.message : 'Unknown chunk error');
      }
    }

    // עיבוד תוצאות
    const receiptIds: ExpoPushReceiptId[] = [];

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const tokenStr = messages[i]?.to as string;

      if (ticket.status === 'ok') {
        result.sent++;
        if (ticket.id) {
          receiptIds.push(ticket.id);
        }
      } else if (ticket.status === 'error') {
        result.failed++;
        const errorMsg = ticket.message || 'Unknown error';
        result.errors.push(errorMsg);

        // אם הטוקן לא תקין, נשבית אותו
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials'
        ) {
          const tokenId = tokenMap.get(tokenStr);
          if (tokenId) {
            console.log(`🔇 Deactivating invalid push token: ${tokenStr}`);
            await prisma.pushToken.update({
              where: { id: tokenId },
              data: { active: false },
            });
          }
        }
      }
    }

    result.success = result.sent > 0;
    console.log(
      `📱 Push sent to user ${params.userId}: ${result.sent} success, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('❌ Error in sendPushToUser:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * שליחת Push Notification לטוקן ספציפי
 */
export async function sendPushToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    if (!Expo.isExpoPushToken(token)) {
      console.warn(`⚠️ Invalid push token: ${token}`);
      return false;
    }

    const messages: ExpoPushMessage[] = [
      {
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
      },
    ];

    const [ticket] = await expo.sendPushNotificationsAsync(messages);

    if (ticket.status === 'ok') {
      return true;
    }

    if (ticket.status === 'error') {
      console.error(`❌ Push to token failed: ${ticket.message}`);
      
      // השבתת טוקן לא תקין
      if (
        ticket.details?.error === 'DeviceNotRegistered' ||
        ticket.details?.error === 'InvalidCredentials'
      ) {
        await prisma.pushToken.updateMany({
          where: { token },
          data: { active: false },
        });
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error sending push to token:', error);
    return false;
  }
}

/**
 * שליחת Push ללקוח לפי customerId (אם מקושר ל-User)
 */
export async function sendPushToCustomer(
  customerId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (!customer?.userId) {
      return false;
    }

    const result = await sendPushToUser({
      userId: customer.userId,
      title,
      body,
      data,
    });

    return result.success;
  } catch (error) {
    console.error('Error sending push to customer:', error);
    return false;
  }
}

/**
 * שליחת Push לבעל עסק לפי businessId
 */
export async function sendPushToBusinessOwner(
  businessId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!business) {
      console.error(`❌ Business not found: ${businessId}`);
      return false;
    }

    const result = await sendPushToUser({
      userId: business.ownerUserId,
      title,
      body,
      data,
    });

    return result.success;
  } catch (error) {
    console.error('❌ Error sending push to business owner:', error);
    return false;
  }
}
