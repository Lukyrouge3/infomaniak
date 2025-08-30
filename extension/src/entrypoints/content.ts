const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const INFOMANIAK_TOKEN =
  "hfCxaNKZMMfdB8R9iFa3qeRWfkiyWwZBFwCg4o47RrbY_GSYQMWHrN4HrzG6zMIlVovlnJuXc3CawecQ";

export default defineContentScript({
  matches: ["*://*.infomaniak.com/*"],
  allFrames: true,
  main(ctx) {
    ctx.addEventListener(window, "wxt:locationchange", async () => {
      const {mailBoxId} = await browser.storage.local.get("mailBoxId");
      if (!mailBoxId) {
        return;
      }

      const div = document.querySelector("div.message-item");
      if (!div) {
        return;
      }

      const {context_message_uid, folderThreads} = parseMailPattern(
        div.classList.value
      );

      console.log(context_message_uid, folderThreads);

      const request = new Request(`http://127.0.0.1:8000/process_mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INFOMANIAK_TOKEN}`,
        },

        body: JSON.stringify({
          mailBoxId,
          folderId: folderThreads[0].folderId,
          threadId: folderThreads[0].threadId,
        }),
      });
      try {
        const response = await fetch(request);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        console.log("Fetched message data:", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching message data:", error);
      }
    });
  },
});

export function parseMailPattern(content: string) {
  console.log("Parsing mail pattern");
  const mailPattern = /mail-(\d+)@([a-zA-Z0-9-]+)/g;
  const context_message_uid = [];
  const folderThreads = [];
  let match;

  while ((match = mailPattern.exec(content)) !== null) {
    const [, threadId, folderId] = match;
    context_message_uid.push(`${threadId}@${folderId}`);
    folderThreads.push({threadId, folderId});
  }

  return {context_message_uid, folderThreads};
}
