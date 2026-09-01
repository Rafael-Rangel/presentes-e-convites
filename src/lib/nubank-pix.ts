function tlv(id: string, value: string) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export const NUBANK_PIX_KEY = (
  process.env.PIX_KEY || "16685568712"
).replace(/\D/g, "");

export function buildPixPayload(input: {
  amount: number;
  txid: string;
  description?: string;
}) {
  const name = "Rafael e Adrielly".slice(0, 25);
  const city = "RIO DE JANEIRO".slice(0, 15);
  const txid = input.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "CONVITE";
  const amount = input.amount.toFixed(2);

  const gui = tlv("00", "br.gov.bcb.pix") + tlv("01", NUBANK_PIX_KEY);
  const merchantAccount = tlv("26", gui);
  const additional = tlv("05", txid);

  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount) +
    tlv("58", "BR") +
    tlv("59", name) +
    tlv("60", city) +
    tlv("62", additional) +
    "6304";

  return body + crc16(body);
}

export function pixQrImageUrl(payload: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;
}
