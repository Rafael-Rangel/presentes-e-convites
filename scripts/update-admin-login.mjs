import pg from "pg";
import crypto from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const email = "rafaelly@gmail.com";
const password = "123";
const weddingId = "11111111-1111-1111-1111-111111111111";

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`create extension if not exists pgcrypto`);

const { rows: byEmail } = await client.query(
  `select id from auth.users where email = $1 limit 1`,
  [email],
);

let id = byEmail[0]?.id;

if (!id) {
  const { rows: old } = await client.query(
    `select id from auth.users where email = 'admin@casamento.local' limit 1`,
  );
  id = old[0]?.id;
}

if (id) {
  await client.query(
    `update auth.users
     set email = $2,
         encrypted_password = crypt($3, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
     where id = $1`,
    [id, email, password],
  );
  await client.query(
    `update auth.identities
     set identity_data = jsonb_build_object('sub', $1::text, 'email', $2::text),
         provider_id = $1::text,
         updated_at = now()
     where user_id = $1 and provider = 'email'`,
    [id, email],
  );
} else {
  id = crypto.randomUUID();
  await client.query(
    `insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', $1::uuid,
      'authenticated', 'authenticated', $2, crypt($3, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rafaelly"}'::jsonb, now(), now(), '', '', '', ''
    )`,
    [id, email, password],
  );
  await client.query(
    `insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      $1::uuid, $1::uuid, jsonb_build_object('sub', $1::text, 'email', $2::text),
      'email', $1::text, now(), now(), now()
    ) on conflict do nothing`,
    [id, email],
  );
}

await client.query(
  `insert into public.profiles (id, wedding_id, full_name)
   values ($1::uuid, $2::uuid, 'Rafaelly')
   on conflict (id) do update set wedding_id = excluded.wedding_id, full_name = excluded.full_name`,
  [id, weddingId],
);

const { rows: guests } = await client.query(
  `select name, slug, category
   from public.guests
   where wedding_id = $1
   order by name
   limit 2`,
  [weddingId],
);

console.log(JSON.stringify({ email, password, guests }, null, 2));
await client.end();
