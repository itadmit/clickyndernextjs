/**
 * SMS Service
 * שירות לשליחת SMS (ניתן להתאים לספק SMS ישראלי כמו iCount, Ariga או אחר)
 */

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(phone: string, message: string): Promise<SMSResponse> {
  const apiKey = process.env.SMS_API_KEY;
  const senderName = process.env.SMS_SENDER_NAME || 'Clickinder';

  if (!apiKey) {
    console.warn('SMS API key not configured');
    return {
      success: false,
      error: 'SMS service not configured',
    };
  }

  try {
    // SMS provider not yet integrated
    console.warn(`SMS not implemented - would send to ${phone}`);
    
    return {
      success: false,
      error: 'SMS provider not configured',
    };
  } catch (error) {
    console.error('SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

