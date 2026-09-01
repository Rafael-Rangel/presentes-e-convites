"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cardChargeAmount } from "@/lib/asaas-fees";
import { isOpenDonation } from "@/lib/open-donation";
import { formatCurrency } from "@/lib/utils";
import type { GiftWithProgress } from "@/lib/types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CheckCircle2, CreditCard, Gift, Lock, QrCode, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

gsap.registerPlugin(useGSAP);

type Props = {
  gift: GiftWithProgress;
  guestSlug?: string | null;
  guestName?: string | null;
  onClose: () => void;
};

type PayResult = {
  contributionId?: string;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  invoiceUrl?: string | null;
  status?: string;
  billingType?: string;
  requiresRedirect?: boolean;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function GiftCheckout({ gift, guestSlug, guestName, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const openDonation = isOpenDonation(gift);
  const remaining = Math.max(0, Number(gift.price) - gift.amount_raised);
  const [amount, setAmount] = useState(
    openDonation ? 50 : remaining > 0 ? remaining : 0,
  );
  const [payerName, setPayerName] = useState(guestName || "");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerCpf, setPayerCpf] = useState("");
  const [method, setMethod] = useState<"pix" | "credit" | "debit">("pix");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayResult | null>(null);
  const pixContributionId = useRef<string | null>(null);

  const { contextSafe } = useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (reduce) {
      gsap.set(
        [overlay, panel, ".popup-item, .popup-bit, .popup-method"],
        { clearProps: "all", opacity: 1 },
      );
      return;
    }

    gsap.set(overlay, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: 30, scale: 0.96 });
    gsap.set(".popup-item", { opacity: 0, y: 16 });
    gsap.set(".popup-bit, .popup-method", { opacity: 0, y: 10 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(overlay, { opacity: 1, duration: 0.38 })
      .to(
        panel,
        { opacity: 1, y: 0, scale: 1, duration: 0.52, ease: "power3.out" },
        0.04,
      )
      .to(
        ".popup-item",
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.055 },
        0.16,
      )
      .to(
        ".popup-bit, .popup-method",
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.035 },
        0.28,
      );
  }, { scope: overlayRef });

  const requestClose = contextSafe(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = overlayRef.current;
    const panel = panelRef.current;

    if (reduce || !overlay || !panel) {
      onClose();
      return;
    }

    gsap
      .timeline({
        defaults: { ease: "power2.in" },
        onComplete: onClose,
      })
      .to(panel, { opacity: 0, y: 24, scale: 0.97, duration: 0.32 })
      .to(overlay, { opacity: 0, duration: 0.28 }, 0.04);
  });

  const chargeAmount =
    method === "pix" ? amount : cardChargeAmount(amount, "credit");

  const canPay = useMemo(() => {
    if (!(amount >= 5 && amount <= remaining && payerName.trim().length > 1)) {
      return false;
    }
    if (onlyDigits(payerCpf).length < 11) return false;
    if (onlyDigits(payerPhone).length < 10) return false;
    return true;
  }, [amount, remaining, payerName, payerCpf, payerPhone]);

  async function pay() {
    if (!canPay) return;
    setLoading(true);
    try {
      const payload = {
        giftId: gift.id,
        amount,
        payerName,
        payerPhone: onlyDigits(payerPhone),
        payerCpfCnpj: onlyDigits(payerCpf),
        guestSlug: guestSlug || null,
        paymentMethod: method,
      };

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no pagamento");

      setResult(data);
      if (method === "pix" && data.contributionId) {
        pixContributionId.current = data.contributionId;
      }

      if (["RECEIVED", "CONFIRMED"].includes(data.status)) {
        toast.success("Pagamento confirmado!");
      } else if (
        (method === "debit" || method === "credit") &&
        data.invoiceUrl
      ) {
        toast.success("Abrindo pagamento seguro...");
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

  const methods = [
    {
      id: "pix" as const,
      label: "Pix",
      icon: QrCode,
      hint: "Padrão",
    },
    {
      id: "credit" as const,
      label: "Crédito",
      icon: CreditCard,
      hint: "Cartão",
    },
    {
      id: "debit" as const,
      label: "Débito",
      icon: CreditCard,
      hint: "Cartão",
    },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        className="relative max-h-[min(92vh,760px)] w-[min(100%,calc(100vw-1.5rem))] max-w-[22.5rem] overflow-y-auto rounded-[1.6rem] border border-[rgba(212,175,55,0.35)] bg-[#fbf7f2] p-4 shadow-[0_24px_60px_rgba(42,36,32,0.35)] sm:w-full sm:max-w-md sm:p-6 md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-item mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-serene-deep">
              {openDonation ? "Doação" : "Valor livre"}
            </p>
            <h3 className="mt-1 font-display text-[1.85rem] leading-tight text-terra-deep">
              {openDonation ? "Doação" : gift.name}
            </h3>
            {openDonation ? (
              <p className="mt-1 text-sm text-muted">
                Doe o valor que quiser, sem escolher um item.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Contribua o valor que puder.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-ink transition hover:bg-black/10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            {result.pixQrCode ? (
              <div className="popup-item rounded-2xl bg-white p-4 text-center shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    result.pixQrCode?.startsWith("http") ||
                    result.pixQrCode?.startsWith("data:")
                      ? result.pixQrCode
                      : `data:image/png;base64,${result.pixQrCode}`
                  }
                  alt="QR Code Pix"
                  className="mx-auto h-52 w-52 rounded-xl bg-white p-2"
                />
                <p className="mt-2 text-sm font-medium text-ink">
                  Escaneie o QR Code no app do banco
                </p>
              </div>
            ) : null}

            {result.pixCopyPaste ? (
              <div className="popup-item">
                <Label>Pix copia e cola</Label>
                <TextCopy value={result.pixCopyPaste} />
              </div>
            ) : null}

            {["RECEIVED", "CONFIRMED"].includes(result.status || "") ? (
              <p className="popup-item rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
                Pagamento confirmado.
              </p>
            ) : method === "pix" ? (
              <p className="popup-item rounded-xl bg-serene/10 px-3 py-2 text-center text-sm text-serene-deep">
                Pague o Pix e toque em Já paguei.
              </p>
            ) : (
              <p className="popup-item rounded-xl bg-serene/10 px-3 py-2 text-center text-sm text-serene-deep">
                Depois do pagamento, a confirmação chega automaticamente.
              </p>
            )}

            {result.invoiceUrl ? (
              <a
                href={result.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="popup-item btn-secondary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"
              >
                <Lock size={16} />
                {method === "pix"
                  ? "Abrir página de pagamento"
                  : "Pagar no checkout seguro"}
              </a>
            ) : null}

            <div className="popup-item">
              <Button
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  const pixId =
                    pixContributionId.current || result.contributionId;
                  if (method === "pix") {
                    if (!pixId) {
                      toast.error("Não foi possível registrar o Pix.");
                      return;
                    }
                    setLoading(true);
                    try {
                      const res = await fetch("/api/payments/confirm-pix", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contributionId: pixId }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(
                          data.error || "Não foi possível confirmar.",
                        );
                      }
                      setResult({ ...result, status: "RECEIVED" });
                      toast.success("Pagamento registrado como recebido.");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível confirmar.",
                      );
                      setLoading(false);
                      return;
                    }
                    setLoading(false);
                  }
                  requestClose();
                }}
              >
                {method === "pix" ? (
                  <span className="btn-label">
                    <CheckCircle2 size={16} aria-hidden />
                    Já paguei
                  </span>
                ) : (
                  "Concluir"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="popup-item rounded-2xl bg-white/80 p-3.5 shadow-sm">
              <Label className="popup-bit">Valor da contribuição</Label>
              <p className="popup-bit mt-0.5 text-[11px] text-muted">
                Contribua o valor que puder.
              </p>
              <p className="popup-bit mt-0.5 text-[10px] text-muted/80">
                Valor mínimo: R$ 5
              </p>
              <div className="popup-bit mt-1.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-muted">R$</span>
                <Input
                  type="number"
                  min="5"
                  step="0.01"
                  max={remaining}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="text-base font-semibold"
                />
              </div>
            </div>

            <div className="popup-item space-y-3 rounded-2xl bg-white/80 p-3.5 shadow-sm">
              <div className="popup-bit">
                <Label>Seu nome</Label>
                <Input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  required
                  placeholder="Como quer aparecer"
                />
              </div>
              <div className="popup-bit">
                <Label>CPF (obrigatório)</Label>
                <Input
                  value={payerCpf}
                  onChange={(e) => setPayerCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="popup-bit">
                <Label>Telefone (obrigatório)</Label>
                <Input
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  required
                />
              </div>
            </div>

            <div className="popup-item">
              <Label className="popup-bit">Forma de pagamento</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {methods.map((item) => {
                  const Icon = item.icon;
                  const active = method === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={`popup-method rounded-2xl px-2 py-3 text-center transition ${
                        active
                          ? "btn-primary shadow-sm"
                          : "bg-white/80 text-ink shadow-sm hover:bg-white"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`mx-auto ${active ? "text-white" : "text-terra-deep"}`}
                      />
                      <span className="mt-1.5 block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] ${
                          active ? "text-white/80" : "text-muted"
                        }`}
                      >
                        {item.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {method === "pix" ? (
              <p className="popup-item flex items-start gap-2 rounded-xl bg-serene/10 px-3 py-2.5 text-sm text-serene-deep">
                <QrCode size={16} className="mt-0.5 shrink-0" />
                Pix Nubank. O QR Code e o Pix copia e cola aparecem na sequência.
              </p>
            ) : (
              <p className="popup-item flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                <Lock size={16} className="mt-0.5 shrink-0" />
                Cartão no checkout seguro. Os dados do cartão não passam nem
                ficam salvos neste site.
              </p>
            )}

            <div className="popup-item">
              <Button
                className="w-full"
                disabled={!canPay || loading}
                onClick={pay}
              >
                <span className="btn-label">
                  <Gift size={16} aria-hidden />
                  {loading
                    ? "Gerando..."
                    : method === "pix"
                      ? `Pagar ${formatCurrency(amount)}`
                      : `Continuar ${formatCurrency(chargeAmount)}`}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TextCopy({ value }: { value: string }) {
  return (
    <div className="mt-1.5 flex gap-2">
      <Input readOnly value={value} className="text-xs" />
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
