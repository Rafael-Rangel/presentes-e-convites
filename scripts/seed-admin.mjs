import pg from "pg";
import crypto from "node:crypto";

const email = process.env.ADMIN_EMAIL || "admin@casamento.local";
const password = process.env.ADMIN_PASSWORD || "change-me";
const weddingId = "11111111-1111-1111-1111-111111111111";

const client = new pg.Client({
  host: "db.kscvfebeczbmrvachiym.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query(`create extension if not exists pgcrypto`);

  const { rows: existing } = await client.query(
    `select id from auth.users where email = $1 limit 1`,
    [email],
  );

  let id = existing[0]?.id;

  if (!id) {
    id = crypto.randomUUID();
    await client.query(
      `
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        $1::uuid,
        'authenticated',
        'authenticated',
        $2,
        crypt($3, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Administrador"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      `,
      [id, email, password],
    );
  }

  await client.query(
    `
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    values (
      $1::uuid,
      $1::uuid,
      jsonb_build_object('sub', $1::text, 'email', $2::text),
      'email',
      $1::text,
      now(), now(), now()
    )
    on conflict do nothing
    `,
    [id, email],
  );

  await client.query(
    `
    insert into public.profiles (id, wedding_id, full_name)
    values ($1::uuid, $2::uuid, 'Administrador')
    on conflict (id) do update set wedding_id = excluded.wedding_id
    `,
    [id, weddingId],
  );

  console.log("Admin ready:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
