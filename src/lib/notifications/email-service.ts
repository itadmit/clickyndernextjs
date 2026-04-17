/**
 * Email Service
 * שירות לשליחת אימיילים דרך Resend
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ResendConfig {
  apiKey: string;
  fromName: string;
  fromEmail: string;
}

let cachedConfig: ResendConfig | null = null;
let configCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getResendConfig(): Promise<ResendConfig | null> {
  const now = Date.now();
  if (cachedConfig && (now - configCacheTime) < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['resend_api_key', 'resend_from_name', 'resend_from_email']
        }
      }
    });

    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    const apiKey = settingsMap.get('resend_api_key') || process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('Resend API key not configured');
      return null;
    }

    const config: ResendConfig = {
      apiKey,
      fromName: settingsMap.get('resend_from_name') || 'Clickynder',
      fromEmail: settingsMap.get('resend_from_email') || 'noreply@clickynder.com',
    };

    cachedConfig = config;
    configCacheTime = now;
    return config;
  } catch (error) {
    console.error('Error loading Resend config:', error);

    if (process.env.RESEND_API_KEY) {
      return {
        apiKey: process.env.RESEND_API_KEY,
        fromName: 'Clickynder',
        fromEmail: 'noreply@clickynder.com',
      };
    }

    return null;
  }
}

export async function sendEmail(params: EmailParams): Promise<EmailResponse> {
  const config = await getResendConfig();

  if (!config) {
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const resend = new Resend(config.apiKey);

    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html || params.body.replace(/\n/g, '<br>'),
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function testResendConnection(): Promise<EmailResponse> {
  const config = await getResendConfig();

  if (!config) {
    return {
      success: false,
      error: 'Resend API key not configured',
    };
  }

  try {
    const resend = new Resend(config.apiKey);

    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: config.fromEmail,
      subject: 'Clickynder - בדיקת חיבור Resend',
      html: '<p>חיבור Resend עובד בהצלחה!</p>',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Resend connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
