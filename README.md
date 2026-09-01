# Presentes e Convites: Casamento Online

Plataforma de convites personalizados, confirmação de presença e lista de presentes com Pix/cartão (Asaas) + painel admin em tempo real (Supabase).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, Realtime, Storage)
- Asaas (Pix, crédito e débito)

## Começar

1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Instale e rode:

```bash
npm install
npm run dev
```

3. Acesse `http://localhost:3000/admin/login`

### Admin seed (local)

```bash
node scripts/seed-admin.mjs
```

Padrão:

- e-mail: `rafaelly@gmail.com`
- senha: `123`

### Schema / seeds

```bash
node scripts/apply-migration.mjs
node scripts/seed-gifts.mjs
```

## Rotas

- `/admin`: painel
- `/casamento/[slug]`: convite personalizado
- `/presentes?guest=slug`: lista de presentes
- `/api/payments/create`: cria cobrança Asaas
- `/api/payments/webhook?token=ASAAS_WEBHOOK_TOKEN`: webhook Asaas

## Pagamentos Asaas

A chave Asaas começa com `$` e o Next.js corrompe se for colocada direto no `.env`.
Use Base64:

```bash
node -e "console.log(Buffer.from(process.argv[1]).toString('base64'))" "$aact_prod_..."
```

Defina `ASAAS_API_KEY_B64` no `.env.local`.

- **Pix:** gera QR + copia-e-cola (exige chave Pix ativa na conta Asaas)
- **Crédito:** cobrança direta (cartão real; cartões de teste só no sandbox)
- **Débito:** Asaas não tem `DEBIT_CARD`; abrimos o checkout hospedado (`invoiceUrl`)
