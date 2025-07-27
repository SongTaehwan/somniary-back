// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Hono } from 'jsr:@hono/hono'
import { cors } from 'jsr:@hono/hono/cors'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const functionName = 'api'
const app = new Hono().basePath(`/${functionName}`)

app.use('*', cors())

app.post('/auth/signup', async (c) => {
  const { email, password } = await c.req.json();

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ message: 'Confirmation email sent.', data });
});

app.post('/auth/signin', async (c) => {
  const { email, password } = await c.req.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return c.json({ error: error.message }, 401);

  // 클라이언트에 access_token 전달
  return c.json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: data.user,
  });
});

app.get('/auth/user', async (c) => {
  const authHeader = c.req.header('Authorization'); // Bearer <access_token>
  if (!authHeader) return c.json({ error: 'No token provided' }, 401);

  const token = authHeader.split(' ')[1];

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error) return c.json({ error: error.message }, 401);

  return c.json({ user });
});

Deno.serve(app.fetch)

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
