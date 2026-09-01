/** Taxas padrão Asaas (à vista, após promoção de 3 meses). */
export const ASAAS_CARD_FEES = {
  credit: { percent: 0.0299, fixed: 0.49 },
  debit: { percent: 0.0189, fixed: 0.35 },
} as const;

/** Valor cobrado no cartão para sobrar `net` líquido após a taxa. */
export function cardChargeAmount(net: number, method: "credit" | "debit") {
  const { percent, fixed } = ASAAS_CARD_FEES[method];
  const gross = (net + fixed) / (1 - percent);
  return Math.ceil(gross * 100) / 100;
}
