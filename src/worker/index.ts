import { Hono } from "hono";

export class GuestbookDO {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === "GET" && url.pathname === "/entries") {
      const entries = (await this.state.storage.get("entries")) as Array<{ name: string; message: string; timestamp: number }> || [];
      return new Response(JSON.stringify(entries), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (request.method === "POST" && url.pathname === "/entries") {
      const body = await request.json() as { name: string; message: string };
      const entries = (await this.state.storage.get("entries")) as Array<{ name: string; message: string; timestamp: number }> || [];
      const newEntry = { name: body.name, message: body.message, timestamp: Date.now() };
      entries.push(newEntry);
      await this.state.storage.put("entries", entries);
      return new Response(JSON.stringify(newEntry), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  }
}

const app = new Hono<{ Bindings: Env & { GUESTBOOK: DurableObjectNamespace } }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/guestbook", async (c) => {
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request("http://localhost/entries"));
  const data = await resp.json() as Array<{ name: string; message: string; timestamp: number }>;
  return c.json(data);
});

app.post("/api/guestbook", async (c) => {
  const body = await c.req.json();
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request("http://localhost/entries", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  }));
  const data = await resp.json() as { name: string; message: string; timestamp: number };
  return c.json(data);
});

export default app;
