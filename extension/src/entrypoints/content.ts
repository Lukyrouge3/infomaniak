import {FlightItinerary, renderFlightsCard} from "@/lib/actions/flight";
import {TrainItinerary, renderTrainsCard} from "@/lib/actions/train";
import { render } from "svelte/server";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const INFOMANIAK_TOKEN =
  "hfCxaNKZMMfdB8R9iFa3qeRWfkiyWwZBFwCg4o47RrbY_GSYQMWHrN4HrzG6zMIlVovlnJuXc3CawecQ";

async function doStuff(ctx: any) {
  console.log("Doing stuff on Infomaniak Mail");
  document.getElementById("infk-flight-card-wrapper")?.remove();
  document.getElementById("infk-train-card-wrapper")?.remove();

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
    await parseResponse(data);
  } catch (error) {
    console.error("Error fetching message data:", error);
  }
}

export default defineContentScript({
  matches: ["*://*.infomaniak.com/*"],
  allFrames: true,
  main(ctx) {
    ctx.addEventListener(window, "wxt:locationchange", doStuff);

    console.log(document.readyState);
    if (document.readyState !== "complete") {
      ctx.addEventListener(window, "DOMContentLoaded", () => doStuff(ctx));
    } else {
      setTimeout(() => {
        doStuff(ctx);
      }, 1000);
    }
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

async function parseResponse(data: string) {
  try {
    const json = JSON.parse(data);
    const container = document.querySelector(
      "body > app-root > app-mail > app-main > div.layout > div > ik-layout > div > div > div > app-mail-main > div > div.mail-content > div.mail-content__body.mail-scroll.mail-content__body--with-nav > app-mail-content > div > div > div.mailContent-content"
    )!;

    switch (json.action) {
      case "flight": {
        const itinerary: FlightItinerary = json.data;
        renderFlightsCard(container, "start", itinerary);
        break;
      }
      case "train": {
        const itinerary: TrainItinerary = json.data;
        renderTrainsCard(container, "start", itinerary);
        break;
      }
      default:
        return;
    }
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return;
  }
}
