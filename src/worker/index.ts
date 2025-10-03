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
    
    if (request.method === "DELETE" && url.pathname.startsWith("/entries/")) {
      const pathParts = url.pathname.split("/");
      const entryId = pathParts[2];
      
      // Delete reply: /entries/{entryId}/replies/{replyId}
      if (pathParts.length === 5 && pathParts[3] === "replies") {
        const replyId = pathParts[4];
        const entries = (await this.state.storage.get("entries")) as DiscussionEntry[] || [];
        
        const entryIndex = entries.findIndex(e => e.id === entryId);
        if (entryIndex === -1) {
          return new Response("Entry not found", { status: 404 });
        }
        
        entries[entryIndex].replies = entries[entryIndex].replies.filter(r => r.id !== replyId);
        await this.state.storage.put("entries", entries);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Delete entry: /entries/{entryId}
      const entries = (await this.state.storage.get("entries")) as DiscussionEntry[] || [];
      const filteredEntries = entries.filter(e => e.id !== entryId);
      await this.state.storage.put("entries", filteredEntries);
      
      return new Response(JSON.stringify({ success: true }), {
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

const app = new Hono<{ Bindings: Env & { GUESTBOOK: DurableObjectNamespace; ADMIN_PASSWORD: string } }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/discussion", async (c) => {
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request("http://localhost/entries"));
  const data: DiscussionEntry[] = await resp.json();
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
  const data: DiscussionEntry = await resp.json();
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
  const data: Reply = await resp.json();
  return c.json(data);
});

app.delete("/api/discussion/:entryId", async (c) => {
  const password = c.req.header("X-Admin-Password");
  if (password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const entryId = c.req.param("entryId");
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request(`http://localhost/entries/${entryId}`, {
    method: "DELETE"
  }));
  const data = await resp.json() as { success: boolean };
  return c.json(data);
});

app.delete("/api/discussion/:entryId/reply/:replyId", async (c) => {
  const password = c.req.header("X-Admin-Password");
  if (password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const entryId = c.req.param("entryId");
  const replyId = c.req.param("replyId");
  const id = c.env.GUESTBOOK.idFromName("guestbook");
  const obj = c.env.GUESTBOOK.get(id);
  const resp = await obj.fetch(new Request(`http://localhost/entries/${entryId}/replies/${replyId}`, {
    method: "DELETE"
  }));
  const data = await resp.json() as { success: boolean };
  return c.json(data);
});

export default app;
