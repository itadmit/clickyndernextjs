/**
 * PayMe (Quick Payments) Service
 * Handles generate-sale and refund-sale API calls
 */

const PAYME_STAGING_URL = 'https://sandbox.payme.io/api';
const PAYME_PRODUCTION_URL = 'https://live.payme.io/api';

function getPaymeUrl(): string {
  return process.env.PAYME_TEST_MODE === 'true' ? PAYME_STAGING_URL : PAYME_PRODUCTION_URL;
}

interface GenerateSaleParams {
  sellerPaymeId: string;
  salePriceCents: number;
  currency: string;
  productName: string;
  buyerKey: string;
  callbackUrl: string;
  returnUrl?: string;
  installments?: string;
  language?: string;
  transactionId?: string;
}

interface GenerateSaleResponse {
  status_code: number;
  sale_url?: string;
  payme_sale_id?: string;
  payme_sale_code?: number;
  price?: number;
  currency?: string;
  status_error_details?: string;
}

export async function generateSale(params: GenerateSaleParams): Promise<GenerateSaleResponse> {
  const url = `${getPaymeUrl()}/generate-sale`;

  const body = {
    seller_payme_id: params.sellerPaymeId,
    sale_price: params.salePriceCents,
    currency: params.currency || 'ILS',
    product_name: params.productName,
    sale_type: 'sale',
    sale_payment_method: 'credit-card',
    buyer_key: params.buyerKey,
    sale_callback_url: params.callbackUrl,
    sale_return_url: params.returnUrl,
    installments: params.installments || '1',
    language: params.language || 'he',
    transaction_id: params.transactionId,
    capture_buyer: '0',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

interface RefundSaleParams {
  sellerPaymeId: string;
  paymeSaleId: string;
  refundAmountCents?: number;
  language?: string;
}

interface RefundSaleResponse {
  status_code: number;
  payme_status?: string;
  sale_status?: string;
  sale_refund_buffer?: number;
  payme_transaction_total?: number;
  status_error_details?: string;
}

export async function refundSale(params: RefundSaleParams): Promise<RefundSaleResponse> {
  const url = `${getPaymeUrl()}/refund-sale`;

  const body: Record<string, any> = {
    seller_payme_id: params.sellerPaymeId,
    payme_sale_id: params.paymeSaleId,
    language: params.language || 'he',
  };

  if (params.refundAmountCents) {
    body.sale_refund_amount = params.refundAmountCents;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}
