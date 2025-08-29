interface GPTTool {
  name: string;
  systemDescription: string;
  reactionEmoji?: string;

  getResponseTool(): any;
  handleCall(...args: any[]): Promise<string>;
}

Deno.serve(async (req) => {
  const router = new URL(req.url).pathname;
  switch (router) {
    case "/":
      return new Response("Hello from Deno!");
    default:
      return new Response("Not Found", {status: 404});
  }
});
