import {call_gpt, GPT_TOOLS} from "./tools/tool.ts";
import {Application, Router, send} from "https://deno.land/x/oak/mod.ts";
import {oakCors} from "https://deno.land/x/cors/mod.ts";

const router = new Router();
router.post("/process_mail", async (ctx) => {
  try {
    const body = ctx.request.body;
    const {mailBoxId, folderId, threadId} = (await body.json()) as {
      mailBoxId: string;
      folderId: string;
      threadId: string;
    };

    const mail = await getMail(mailBoxId, folderId, threadId);
    const messages = [getSystemPrompt(), {role: "user", content: `${mail}`}];

    const response = await call_gpt(messages);

    ctx.response.status = 200;
    ctx.response.headers.set("content-type", "text/plain; charset=utf-8");
    ctx.response.body = response;
  } catch (_err) {
    console.error(_err);
    ctx.response.status = 500;
    ctx.response.body = "Failed to process mail";
  }
});
const app = new Application();
const withCors = oakCors();
app.use(withCors);
app.use(router.routes());

await app.listen({port: 8000});

function getSystemPrompt() {
  return {
    role: "system",
    content: `You are an AI trained to help extract informations from mails
		You have tools, pick and chose the ones you think are needed.
		
		Tools:
		${GPT_TOOLS.map((t) => `-${t.systemDescription}`).join("\n")}`,
  };
}

async function getMail(
  mailBoxId: string,
  folderId: string,
  threadId: string
): Promise<string> {
  const INFOMANIAK_TOKEN = Deno.env.get("INFOMANIAK_TOKEN");
  if (!INFOMANIAK_TOKEN) {
    throw new Error("INFOMANIAK_TOKEN is not set");
  }

  const request = new Request(
    `https://mail.infomaniak.com/api/mail/${mailBoxId}/folder/${folderId}/message/${threadId}?prefered_format=plain`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INFOMANIAK_TOKEN}`,
      },
    }
  );
  try {
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const {data} = await response.json();
    return data.body.value;
  } catch (error) {
    console.error("Error fetching message data:", error);
    throw error;
  }
}

async function processMail(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {status: 405});
  }

  const body = (await req.json()) as {
    mailBoxId: string;
    folderId: string;
    threadId: string;
  };

  try {
    const mail = await getMail(body.mailBoxId, body.folderId, body.threadId);
    const messages = [getSystemPrompt(), {role: "user", content: `${mail}`}];

    const response = await call_gpt(messages);
    return new Response(response, {status: 200});
  } catch (_error) {
    return new Response("Failed to fetch mail", {status: 500});
  }
}
