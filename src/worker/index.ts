import { Hono } from "hono";

interface Reply {
  id: string;
  name: string;
  message: string;
  timestamp: number;
}

interface DiscussionEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  replies: Reply[];
}

export class GuestbookDO {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === "GET" && url.pathname === "/entries") {
      const entries = (await this.state.storage.get("entries")) as DiscussionEntry[] || [];
      return new Response(JSON.stringify(entries), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (request.method === "POST" && url.pathname === "/entries") {
      const body = await request.json() as { name: string; message: string };
      const entries = (await this.state.storage.get("entries")) as DiscussionEntry[] || [];
      const newEntry: DiscussionEntry = { 
        id: crypto.randomUUID(),
        name: body.name, 
        message: body.message, 
        timestamp: Date.now(),
        replies: []
      };
      entries.unshift(newEntry);
      await this.state.storage.put("entries", entries);
      return new Response(JSON.stringify(newEntry), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (request.method === "POST" && url.pathname.startsWith("/entries/") && url.pathname.endsWith("/replies")) {
      const entryId = url.pathname.split("/")[2];
      const body = await request.json() as { name: string; message: string };
      const entries = (await this.state.storage.get("entries")) as DiscussionEntry[] || [];
      
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return new Response("Entry not found", { status: 404 });
      }
      
      const newReply: Reply = {
        id: crypto.randomUUID(),
        name: body.name,
        message: body.message,
        timestamp: Date.now()
      };
      
      entries[entryIndex].replies.push(newReply);
      await this.state.storage.put("entries", entries);
      
      return new Response(JSON.stringify(newReply), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  }
}

const app = new Hono<{ Bindings: Env & { GUESTBOOK: DurableObjectNamespace } }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/discussion", async (c) => {
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request("http://localhost/entries"));
  const data = await resp.json() as DiscussionEntry[];
  return c.json(data);
});

app.post("/api/discussion", async (c) => {
  const body = await c.req.json();
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request("http://localhost/entries", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  }));
  const data = await resp.json() as DiscussionEntry;
  return c.json(data);
});

app.post("/api/discussion/:entryId/reply", async (c) => {
  const entryId = c.req.param("entryId");
  const body = await c.req.json();
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request(`http://localhost/entries/${entryId}/replies`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  }));
  const data = await resp.json() as Reply;
  return c.json(data);
});

export default app;
