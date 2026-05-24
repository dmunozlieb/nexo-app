import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

type Payload = {
  reportId: string;
  action: "resolve" | "reject" | "hide";
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server not configured", { status: 500 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const payload = (await request.json()) as Payload;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const status = payload.action === "reject" ? "rejected" : "resolved";
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", payload.reportId);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
});
