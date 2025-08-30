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
        await parseResponse(data);
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

async function parseResponse(data: string) {
  try {
    const json = JSON.parse(data);
    const container = document.querySelector(
      "body > app-root > app-mail > app-main > div.layout > div > ik-layout > div > div > div > app-mail-main > div > div.mail-content > div.mail-content__body.mail-scroll.mail-content__body--with-nav > app-mail-content > div > div > div.mailContent-content"
    )!;

    switch (json.action) {
      case "flight": {
        const itinerary: FlightItinerary = json.itinerary;
        renderFlightsCard(container, "start", itinerary);
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

export interface FlightSegment {
  title: string; // "De Mulhouse à Skopje"
  fromCode: string; // "MLH"
  toCode: string; // "SKP"
  departure: string; // "15:20"
  arrival: string; // "17:30"
  duration: string; // "2 h 20"
  airline: string; // "Wizz Air"
  flightNumber: string; // "W64793"
}
export interface Passenger {
  lastname: string;
  firstname: string;
}
export interface FlightItinerary {
  segments: FlightSegment[];
  confirmationCode: string;
  passengers: Passenger[];
}

export function renderFlightsCard(
  container: Element = document.body,
  position: "start" | "end" = "end",
  itinerary: FlightItinerary
) {
  // Données par défaut si rien n'est passé
  const data: FlightItinerary = itinerary;

  const dateLabel = (departure: string, arrival: string) => {
    const d = new Date(departure);
    const a = new Date(arrival);
    return `${d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    })} → ${a.toLocaleDateString(undefined, {day: "2-digit", month: "short"})}`;
  };

  // Conteneur principal (carte)
  const card = document.createElement("div");
  card.className = "infk-flight-card";

  // Styles encapsulés via une balise <style> scoping par classe racine
  const style = document.createElement("style");
  style.textContent = `
    .infk-flight-card {
      width: 100%;                /* ← adaptatif à l'espace dispo */
      box-sizing: border-box;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
      padding: 12px;
      margin: 12px 0;
    }
    .infk-row {
      display: flex;
      gap: 24px;
      align-items: center;
      padding: 6px 4px;
      flex-wrap: wrap;
    }
    .infk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 4px;
      border-radius: 8px;
    }
    .infk-title { font-weight: 600; font-size: 1.02rem; line-height: 1.2; }
    .infk-subtitle { color:#6b7280; font-size: .95rem; margin-top: 2px; }
    .infk-icon { width: 24px; text-align: center; opacity: .9; }
    .infk-kv { min-width: 140px; }
    .infk-k { font-size: .8rem; color: #6b7280; }
    .infk-v { font-weight: 600; font-size: .98rem; }
    .infk-divider { border: none; border-top: 1px solid #f1f5f9; margin: 10px 0; }
    .infk-badge {
      display:inline-block; padding:2px 8px; border:1px solid #e5e7eb;
      border-radius:999px; font-size:.8rem; color:#374151; background:#f9fafb;
    }
    .infk-footer { margin-top: 8px; font-size:.85rem; color:#6b7280; }
  `;

  // Construction du contenu
  const segHtml = data.segments
    .map(
      (seg, i) => `
    <div class="infk-header">
      <div>
        <div class="infk-title">${seg.title}</div>
        <div class="infk-subtitle">${dateLabel(
          seg.departure,
          seg.arrival
        )}</div>
      </div>
      ${
        i === 0 && data.confirmationCode
          ? `<span class="infk-badge" title="Code de réservation">Code de confirmation : ${data.confirmationCode}</span>`
          : ``
      }
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">🛫</div>
      <div class="infk-kv">
        <div class="infk-k">De</div>
        <div class="infk-v" title="${seg.fromCode ?? ""}">${
        seg.fromCode ?? "—"
      }</div>
      </div>
      <div class="infk-kv">
        <div class="infk-k">À</div>
        <div class="infk-v" title="${seg.toCode ?? ""}">${
        seg.toCode ?? "—"
      }</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">⏱️</div>
      <div class="infk-kv">
        <div class="infk-k">Décollage</div>
        <div class="infk-v">${seg.departure ?? "—"}</div>
      </div>
      <div class="infk-kv">
        <div class="infk-k">Atterrissage</div>
        <div class="infk-v">${seg.arrival ?? "—"}</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">⌚</div>
      <div class="infk-kv">
        <div class="infk-k">Durée</div>
        <div class="infk-v">${seg.duration ?? "—"}</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">🧾</div>
      <div class="infk-kv">
        <div class="infk-k">${seg.airline ? seg.airline : "Compagnie"}</div>
        <div class="infk-v">${seg.flightNumber ?? "—"}</div>
      </div>
    </div>
  `
    )
    .join('<hr class="infk-divider" />');

  card.innerHTML = `
    ${segHtml}
    ${
      data.basedOnEmailsCount
        ? `<div class="infk-footer">D’après ${data.basedOnEmailsCount} e-mail${
            data.basedOnEmailsCount! > 1 ? "s" : ""
          }</div>`
        : ``
    }
  `;

  // Injection : au début ou à la fin du conteneur
  const wrapper = document.createElement("div");
  wrapper.appendChild(style);
  wrapper.appendChild(card);

  position === "start"
    ? container.prepend(wrapper)
    : container.appendChild(wrapper);
  return wrapper; // on retourne le bloc inséré (style + carte)
}
