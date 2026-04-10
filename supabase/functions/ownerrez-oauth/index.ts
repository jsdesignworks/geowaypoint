/**
 * Spec §15 — OwnerRez OAuth callback (stub).
 * Deploy: `supabase functions deploy ownerrez-oauth`
 * Implement: exchange `code` for tokens, upsert `ownerrez_tokens` with service role.
 */
Deno.serve((_req) => {
  return new Response(
    JSON.stringify({
      ok: false,
      message: 'Implement OwnerRez OAuth token exchange per GeoWaypoint spec §15.',
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
});
