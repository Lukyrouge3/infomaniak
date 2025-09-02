export default defineBackground(() => {
  console.log("Hello background!!", {id: browser.runtime.id});

  browser.webRequest.onCompleted.addListener(
    (details) => {
      const pattern =
        /https:\/\/mail\.infomaniak\.com\/api\/mail\/([a-f0-9-]+)\//;
      const match = details.url.match(pattern);
      if (!match) {
        return;
      }

      const mailBoxId = match[1];
      browser.storage.local.set({mailBoxId});

      console.log("MailBox ID stored:", mailBoxId);
    },
    {
      urls: ["*://mail.infomaniak.com/api/*"],
    }
  );
});
