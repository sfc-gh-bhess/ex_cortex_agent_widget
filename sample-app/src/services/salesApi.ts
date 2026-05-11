/**
 * Store sales report — calls the backend Snowflake SQL API proxy.
 */

import { config } from '../config/env';

export interface SalesByStoreRow {
  storeId: number;
  total: number;
}

export interface SalesByStoreResponse {
  rows: SalesByStoreRow[];
}

export const fetchSalesByStore = async (
  startDate: string,
  endDate: string
): Promise<SalesByStoreResponse> => {
  const response = await fetch(`${config.backendUrl}/api/sales-by-store`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as SalesByStoreResponse;
};
