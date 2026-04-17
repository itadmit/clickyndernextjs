const PAYPLUS_API_URL = process.env.PAYPLUS_API_URL || 'https://restapi.payplus.co.il/api/v1.0';
const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY || '';
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY || '';
const PAYPLUS_PAYMENT_PAGE_UID = process.env.PAYPLUS_PAYMENT_PAGE_UID || '';
const PAYPLUS_TERMINAL_UID = process.env.PAYPLUS_TERMINAL_UID || '';
const PAYPLUS_CASHIER_UID = process.env.PAYPLUS_CASHIER_UID || '';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': PAYPLUS_API_KEY,
    'secret-key': PAYPLUS_SECRET_KEY,
  };
}

interface GeneratePaymentLinkParams {
  amount: number;
  description: string;
  businessId: string;
  packageCode: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  callbackUrl: string;
}

interface PayPlusPaymentLinkResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data: {
    payment_page_link: string;
    page_request_uid: string;
  };
}

export async function generatePaymentLink(params: GeneratePaymentLinkParams): Promise<PayPlusPaymentLinkResponse> {
  const body = {
    payment_page_uid: PAYPLUS_PAYMENT_PAGE_UID,
    charge_method: 1,
    create_token: true,
    currency_code: 'ILS',
    amount: params.amount,
    description: params.description,
    more_info: JSON.stringify({
      businessId: params.businessId,
      packageCode: params.packageCode,
    }),
    refURL_success: params.successUrl,
    refURL_failure: params.successUrl + '?payment=failed',
    refURL_callback: params.callbackUrl,
    customer: {
      customer_name: params.customerName || '',
      email: params.customerEmail || '',
    },
    items: [
      {
        name: params.description,
        quantity: 1,
        price: params.amount,
        vat_type: 0,
      },
    ],
  };

  const res = await fetch(`${PAYPLUS_API_URL}/PaymentPages/generateLink`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPlus generateLink failed (${res.status}): ${text}`);
  }

  return res.json();
}

interface CreateRecurringParams {
  customerUid: string;
  cardToken: string;
  amount: number;
  description: string;
  startDate: string; // YYYY-MM-DD
}

interface PayPlusRecurringResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data: {
    recurring_payment_uid: string;
  };
}

export async function createRecurringPayment(params: CreateRecurringParams): Promise<PayPlusRecurringResponse> {
  const body = {
    terminal_uid: PAYPLUS_TERMINAL_UID,
    cashier_uid: PAYPLUS_CASHIER_UID,
    customer_uid: params.customerUid,
    card_token: params.cardToken,
    recurring_type: 2, // monthly
    recurring_range: 1,
    number_of_charges: 0, // unlimited
    instant_first_payment: false,
    start_date: params.startDate,
    currency_code: 'ILS',
    amount: params.amount,
    description: params.description,
    items: [
      {
        name: params.description,
        quantity: 1,
        price: params.amount,
        vat_type: 0,
      },
    ],
  };

  const res = await fetch(`${PAYPLUS_API_URL}/RecurringPayments/Add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPlus RecurringPayments/Add failed (${res.status}): ${text}`);
  }

  return res.json();
}
