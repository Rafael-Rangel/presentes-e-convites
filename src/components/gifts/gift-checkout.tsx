"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { GiftWithProgress } from "@/lib/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  gift: GiftWithProgress;
  guestSlug?: string | null;
  guestName?: string | null;
  onClose: () => void;
};

type PayResult = {
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  invoiceUrl?: string | null;
  status?: string;
  billingType?: string;
  requiresRedirect?: boolean;
};

export function GiftCheckout({ gift, guestSlug, guestName, onClose }: Props) {
  const remaining = Math.max(0, Number(gift.price) - gift.amount_raised);
  const [amount, setAmount] = useState(
    remaining > 0 ? Math.min(remaining, remaining) : 0,
  );
  const [payerName, setPayerName] = useState(guestName || "");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerCpf, setPayerCpf] = useState("");
  const [method, setMethod] = useState<"pix" | "credit" | "debit">("pix");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayResult | null>(null);

  const [card, setCard] = useState({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    cpfCnpj: "",
    postalCode: "",
    addressNumber: "",
  });

  const canPay = useMemo(() => {
    if (!(amount > 0 && amount <= remaining && payerName.trim().length > 1)) {
      return false;
    }
    if (payerCpf.replace(/\D/g, "").length < 11) return false;

    if (method === "credit") {
      return Boolean(
        payerEmail &&
          card.holderName &&
          card.number &&
          card.expiryMonth &&
          card.expiryYear &&
          card.ccv &&
          card.postalCode &&
          card.addressNumber &&
          payerPhone,
      );
    }
    if (method === "debit") {
      return Boolean(payerEmail);
    }
    return true;
  }, [amount, remaining, payerName, payerCpf, method, payerEmail, payerPhone, card]);

  async function pay() {
    if (!canPay) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        giftId: gift.id,
        amount,
        payerName,
        payerEmail: payerEmail || null,
        payerPhone: payerPhone || null,
        payerCpfCnpj: payerCpf || card.cpfCnpj || null,
        guestSlug: guestSlug || null,
        paymentMethod: method,
      };

      if (method === "credit") {
        payload.creditCard = {
          holderName: card.holderName,
          number: card.number.replace(/\s/g, ""),
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          ccv: card.ccv,
        };
        payload.creditCardHolderInfo = {
          name: card.holderName || payerName,
          email: payerEmail,
          cpfCnpj: payerCpf || card.cpfCnpj,
          postalCode: card.postalCode,
          addressNumber: card.addressNumber,
          phone: payerPhone,
        };
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no pagamento");

      setResult(data);

      if (["RECEIVED", "CONFIRMED"].includes(data.status)) {
        toast.success("Pagamento confirmado!");
      } else if (method === "debit" && data.invoiceUrl) {
        toast.success("Abrindo checkout seguro da Asaas...");
        window.open(data.invoiceUrl, "_blank");
      } else if (method === "pix" && !data.pixCopyPaste && data.invoiceUrl) {
        toast.message("QR indisponível no momento. Use o link da fatura.");
      } else {
        toast.success("Pagamento gerado");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fbf7f2] p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl text-terra-deep">{gift.name}</h3>
            <p className="text-sm text-muted">
              Restante: {formatCurrency(remaining)}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-muted">
            Fechar
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            {result.pixQrCode ? (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${result.pixQrCode}`}
                  alt="QR Code Pix"
                  className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
                />
              </div>
            ) : null}

            {result.pixCopyPaste ? (
              <div>
                <Label>Pix copia e cola</Label>
                <TextCopy value={result.pixCopyPaste} />
              </div>
            ) : null}

            {["RECEIVED", "CONFIRMED"].includes(result.status || "") ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
                Pagamento confirmado automaticamente.
              </p>
            ) : (
              <p className="text-center text-sm text-muted">
                Após o pagamento, a confirmação é automática via Asaas.
              </p>
            )}

            {result.invoiceUrl ? (
              <a
                href={result.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm"
              >
                {method === "debit"
                  ? "Pagar com débito no checkout Asaas"
                  : "Abrir página de pagamento"}
              </a>
            ) : null}

            <Button className="w-full" onClick={onClose}>
              Concluir
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Valor da contribuição</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Seu nome</Label>
              <Input
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>CPF (obrigatório)</Label>
              <Input
                value={payerCpf}
                onChange={(e) => setPayerCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div>
              <Label>
                E-mail
                {method !== "pix" ? " (obrigatório)" : " (opcional)"}
              </Label>
              <Input
                type="email"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                required={method !== "pix"}
              />
            </div>
            <div>
              <Label>
                Telefone
                {method === "credit" ? " (obrigatório)" : ""}
              </Label>
              <Input
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="11999999999"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["pix", "credit", "debit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-xl px-2 py-2 text-sm ${
                    method === m ? "btn-primary" : "bg-white/70"
                  }`}
                >
                  {m === "pix" ? "Pix" : m === "credit" ? "Crédito" : "Débito"}
                </button>
              ))}
            </div>

            {method === "debit" ? (
              <p className="rounded-xl bg-serene/10 px-3 py-2 text-sm text-serene-deep">
                No débito, você será direcionado ao checkout seguro da Asaas para
                concluir o pagamento.
              </p>
            ) : null}

            {method === "credit" ? (
              <div className="grid gap-3 rounded-2xl bg-white/70 p-3">
                <div>
                  <Label>Nome no cartão</Label>
                  <Input
                    value={card.holderName}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, holderName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Número do cartão</Label>
                  <Input
                    inputMode="numeric"
                    value={card.number}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, number: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Mês</Label>
                    <Input
                      placeholder="MM"
                      value={card.expiryMonth}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiryMonth: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Input
                      placeholder="AAAA"
                      value={card.expiryYear}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiryYear: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input
                      value={card.ccv}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, ccv: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={card.postalCode}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, postalCode: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Nº</Label>
                    <Input
                      value={card.addressNumber}
                      onChange={(e) =>
                        setCard((c) => ({
                          ...c,
                          addressNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <Button className="w-full" disabled={!canPay || loading} onClick={pay}>
              {loading
                ? "Gerando..."
                : method === "debit"
                  ? `Continuar ${formatCurrency(amount)}`
                  : `Pagar ${formatCurrency(amount)}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TextCopy({ value }: { value: string }) {
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} />
      <Button
        type="button"
        variant="secondary"
        className="btn-press shrink-0"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          toast.success("Copiado");
        }}
      >
        Copiar
      </Button>
    </div>
  );
}
