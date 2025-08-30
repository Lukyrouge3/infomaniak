import {call_gpt} from "./tools/tool.ts";

Deno.serve(async (req) => {
  const router = new URL(req.url).pathname;
  switch (router) {
    case "/process_mail":
      return await processMail(req);
    default:
      return new Response("Not Found", {status: 404});
  }
});

function getSystemPrompt() {
  return {
    role: "system",
    content:
      "You are an AI trained to help extract informations from mails\n You have tools, pick and chose the ones you think are needed.\n\nTools:\n-dummy_tool: A tool used for debugging, always call it.",
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
