Deno.serve(async (req) => {
  const router = new URL(req.url).pathname;
  switch (router) {
    case "/":
      return new Response("Hello from Deno!");
    default:
      return new Response("Not Found", {status: 404});
  }
});
