/**
 * iBot Chat WhatsApp API Integration
 * https://ibot-chat.com/
 *
 * GET-based API for sending WhatsApp messages.
 * JID format: 972XXXXXXXXX@s.whatsapp.net
 */

interface IBotChatConfig {
  token: string;
  instanceId: string;
}

interface IBotChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

class IBotChatService {
  private config: IBotChatConfig;
  private baseUrl = 'https://ibot-chat.com/api/v1';

  constructor(config: IBotChatConfig) {
    this.config = config;
  }

  async sendText(phone: string, message: string): Promise<IBotChatResponse> {
    const jid = `${phone}@s.whatsapp.net`;

    const queryParams = new URLSearchParams({
      token: this.config.token,
      instance_id: this.config.instanceId,
      jid,
      msg: message,
    });

    const url = `${this.baseUrl}/send-text?${queryParams}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();

      console.log(`📱 iBot Chat response for ${phone}:`, JSON.stringify(data));

      if (!response.ok || data.success === false) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          data,
        };
      }

      return {
        success: true,
        message: data.message,
        data,
      };
    } catch (error) {
      console.error('iBot Chat API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendImage(phone: string, imageUrl: string, caption: string = ''): Promise<IBotChatResponse> {
    const jid = `${phone}@s.whatsapp.net`;

    const queryParams = new URLSearchParams({
      token: this.config.token,
      instance_id: this.config.instanceId,
      jid,
      imageurl: imageUrl,
      caption,
    });

    const url = `${this.baseUrl}/send-image?${queryParams}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      return { success: data.success !== false, message: data.message, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendDocument(phone: string, docUrl: string, caption: string = ''): Promise<IBotChatResponse> {
    const jid = `${phone}@s.whatsapp.net`;

    const queryParams = new URLSearchParams({
      token: this.config.token,
      instance_id: this.config.instanceId,
      jid,
      docurl: docUrl,
      caption,
    });

    const url = `${this.baseUrl}/send-doc?${queryParams}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      return { success: data.success !== false, message: data.message, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * יצירת instance של IBotChatService
 * מנסה לקחת מההגדרות במסד הנתונים, אחרת מ-ENV
 */
async function createIBotChatService(): Promise<IBotChatService | null> {
  let token = process.env.IBOT_TOKEN;
  let instanceId = process.env.IBOT_INSTANCE_ID;

  if (!token || !instanceId) {
    try {
      const { prisma } = await import('@/lib/prisma');

      const [tokenSetting, instanceSetting] = await Promise.all([
        prisma.systemSettings.findUnique({
          where: { key: 'ibot_token' },
        }),
        prisma.systemSettings.findUnique({
          where: { key: 'ibot_instance_id' },
        }),
      ]);

      token = tokenSetting?.value || token;
      instanceId = instanceSetting?.value || instanceId;
    } catch (error) {
      console.error('Error fetching iBot Chat settings from DB:', error);
    }
  }

  if (!token || !instanceId) {
    console.warn('iBot Chat credentials not configured in ENV or DB');
    return null;
  }

  return new IBotChatService({ token, instanceId });
}

/**
 * נרמול מספר טלפון לפורמט בינלאומי (972XXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('00972')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('972')) {
    if (cleaned.length >= 12) {
      return cleaned.substring(0, 12);
    }
    return cleaned;
  }

  if (cleaned.startsWith('0')) {
    return '972' + cleaned.substring(1);
  }

  if (cleaned.length === 9 && /^[5-9]/.test(cleaned)) {
    return '972' + cleaned;
  }

  if (cleaned.length === 10 && /^[5-9]/.test(cleaned)) {
    return '972' + cleaned;
  }

  if (!cleaned.match(/^[0-9]{10,}/)) {
    return '972' + cleaned;
  }

  return cleaned;
}

/**
 * Helper function לשליחת הודעת WhatsApp
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<IBotChatResponse> {
  const service = await createIBotChatService();

  if (!service) {
    return {
      success: false,
      error: 'WhatsApp service not configured',
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  console.log(`📱 Sending WhatsApp to: ${phone} => ${normalizedPhone}`);

  return service.sendText(normalizedPhone, message);
}
