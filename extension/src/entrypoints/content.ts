const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const INFOMANIAK_TOKEN =
  "x7-xaM8eLYKQ80jEabuZcSEFUTfrSodWI3Uuiw2S8UrEc2icrsTYy4SbyphUhj6AhBIYjc8Pd-gElVx1";

export default defineContentScript({
  matches: ["*://*.infomaniak.com/*"],
  allFrames: true,
  main(ctx) {
    ctx.addEventListener(window, "wxt:locationchange", async () => {
      try {
		const bloc = document.querySelector('body > app-root > app-mail > app-main > div.layout > div > ik-layout > div > div > div > app-mail-main > div > div.mail-content > div.mail-content__body.mail-scroll.mail-content__body--with-nav > app-mail-content > div > div > div.mailContent-content')!;
		renderFlightsCard(bloc, 'start'); // apparaît en tête
		renderInfkTrainCard(bloc, 'start'); // apparaît en tête
      } catch (error) {
        console.error("Error fetching message data:", error);
      }
    });
  },
});

// Types optionnels (tu peux les déplacer ailleurs si besoin)
export interface FlightSegment {
  title: string;         // "De Mulhouse à Skopje"
  dateLabel: string;     // "ven. 13 juin • 15:20 – 17:30"
  fromCode?: string;     // "MLH"
  toCode?: string;       // "SKP"
  departure?: string;    // "15:20"
  arrival?: string;      // "17:30"
  duration?: string;     // "2 h 20"
  airline?: string;      // "Wizz Air"
  flightNumber?: string; // "W64793"
}
export interface FlightItinerary {
  segments: FlightSegment[];
  confirmationCode?: string;
  basedOnEmailsCount?: number;
}

export function renderFlightsCard(
  container: Element = document.body,
  position: 'start' | 'end' = 'end',
  itinerary?: FlightItinerary
) {
  // Données par défaut si rien n'est passé
  const data: FlightItinerary = itinerary ?? {
    segments: [
      {
        title: 'De Mulhouse à Skopje',
        dateLabel: 'ven. 13 juin • 15:20 – 17:30',
        fromCode: 'MLH',
        toCode: 'SKP',
        departure: '15:20',
        arrival: '17:30',
        duration: '2 h 10',
        airline: 'Wizz Air',
        flightNumber: 'W6xxxx',
      },
      {
        title: 'De Skopje à Mulhouse',
        dateLabel: 'jeu. 19 juin • 18:35 – 20:55',
        fromCode: 'SKP',
        toCode: 'MLH',
        departure: '18:35',
        arrival: '20:55',
        duration: '2 h 20',
        airline: 'Wizz Air',
        flightNumber: 'W64793',
      },
    ],
    confirmationCode: 'ZQSJUX',
    basedOnEmailsCount: 1,
  };

  // Conteneur principal (carte)
  const card = document.createElement('div');
  card.className = 'infk-flight-card';

  // Styles encapsulés via une balise <style> scoping par classe racine
  const style = document.createElement('style');
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
  const segHtml = data.segments.map((seg, i) => `
    <div class="infk-header">
      <div>
        <div class="infk-title">${seg.title}</div>
        <div class="infk-subtitle">${seg.dateLabel}</div>
      </div>
      ${i === 0 && data.confirmationCode ? `<span class="infk-badge" title="Code de réservation">Code de confirmation : ${data.confirmationCode}</span>` : ``}
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">🛫</div>
      <div class="infk-kv">
        <div class="infk-k">De</div>
        <div class="infk-v" title="${seg.fromCode ?? ''}">${seg.fromCode ?? '—'}</div>
      </div>
      <div class="infk-kv">
        <div class="infk-k">À</div>
        <div class="infk-v" title="${seg.toCode ?? ''}">${seg.toCode ?? '—'}</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">⏱️</div>
      <div class="infk-kv">
        <div class="infk-k">Décollage</div>
        <div class="infk-v">${seg.departure ?? '—'}</div>
      </div>
      <div class="infk-kv">
        <div class="infk-k">Atterrissage</div>
        <div class="infk-v">${seg.arrival ?? '—'}</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">⌚</div>
      <div class="infk-kv">
        <div class="infk-k">Durée</div>
        <div class="infk-v">${seg.duration ?? '—'}</div>
      </div>
    </div>

    <div class="infk-row">
      <div class="infk-icon" aria-hidden="true">🧾</div>
      <div class="infk-kv">
        <div class="infk-k">${seg.airline ? seg.airline : 'Compagnie'}</div>
        <div class="infk-v">${seg.flightNumber ?? '—'}</div>
      </div>
    </div>
  `).join('<hr class="infk-divider" />');

  card.innerHTML = `
    ${segHtml}
    ${data.basedOnEmailsCount ? `<div class="infk-footer">D’après ${data.basedOnEmailsCount} e-mail${data.basedOnEmailsCount! > 1 ? 's' : ''}</div>` : ``}
  `;

  // Injection : au début ou à la fin du conteneur
  const wrapper = document.createElement('div');
  wrapper.appendChild(style);
  wrapper.appendChild(card);

  position === 'start' ? container.prepend(wrapper) : container.appendChild(wrapper);
  return wrapper; // on retourne le bloc inséré (style + carte)
}


// --- Types (optionnels) ---
export interface TrainReservation {
  title: string;                 // "Renens VD–Basel SBB"
  dateRangeLabel: string;        // "13 juin 10:41–12:18"
  departureDateTimeLabel: string;// "13 juin 10:41"
  arrivalDateTimeLabel: string;  // "13 juin 12:18"
  fromStation: string;           // "Renens VD"
  toStation: string;             // "Basel SBB"
  duration: string;              // "1h et 37 min"
  confirmationNumber?: string;   // "1344190794"
  passenger?: string;            // "Gajdov Toma"
  classLabel?: string;           // "2. Classe"
}

export function renderInfkTrainCard(
  container: Element = document.body,
  position: 'start' | 'end' = 'end',
  reservation?: TrainReservation
) {
  // Valeurs par défaut = celles de ta capture Gmail
  const data: TrainReservation = reservation ?? {
    title: 'Renens VD–Basel SBB',
    dateRangeLabel: 'ven 13 juin • 10:41 – 12:18',
    departureDateTimeLabel: '13 juin 10:41',
    arrivalDateTimeLabel: '13 juin 12:18',
    fromStation: 'Renens VD',
    toStation: 'Basel SBB',
    duration: '1h et 37 min',
    confirmationNumber: '1344190794',
    passenger: 'Gajdov Toma',
    classLabel: '2. Classe',
  };

  // Wrapper + styles scoppés par classe racine
  const wrapper = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = `
    .infk-train-card {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
      padding: 16px 16px 8px 16px;
      margin: 12px 0;
    }
    .infk-head {
      display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
      margin-bottom: 12px;
    }
    .infk-title { font-weight:600; font-size:1.05rem; line-height:1.2; }
    .infk-sub { color:#6b7280; font-size:.95rem; margin-top:2px; }
    .infk-grid {
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px 32px;
      align-items:start;
      padding-top: 4px;
    }
    .infk-item { display:flex; gap:10px; align-items:flex-start; }
    .infk-ico { width:22px; text-align:center; opacity:.9; line-height:1.2; }
    .infk-k { font-size:.85rem; color:#6b7280; }
    .infk-v { font-weight:600; font-size:.98rem; margin-top:2px; }
    .infk-hr {
      border: none; border-top: 1px solid #f1f5f9; margin: 14px 0 8px 0;
    }
  `;

  const card = document.createElement('div');
  card.className = 'infk-train-card';

  // Header
  const head = `
    <div class="infk-head">
      <div>
        <div class="infk-title">${data.title}</div>
        <div class="infk-sub">${data.dateRangeLabel}</div>
      </div>
      ${data.confirmationNumber ? `<span class="infk-badge" title="Code de réservation">Code de Confirmation : ${data.confirmationNumber}</span>` : ``}
    </div>
  `;

  // Grille d’infos (2–4 colonnes responsives)
  const grid = `
    <div class="infk-grid">

      <div class="infk-item">
        <div class="infk-ico">🕒</div>
        <div>
          <div class="infk-k">Heure de départ</div>
          <div class="infk-v">${data.departureDateTimeLabel}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">🕒</div>
        <div>
          <div class="infk-k">Heure d'arrivée</div>
          <div class="infk-v">${data.arrivalDateTimeLabel}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">👤</div>
        <div>
          <div class="infk-k">Passager</div>
          <div class="infk-v">${data.passenger ?? '—'}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">⏱️</div>
        <div>
          <div class="infk-k">Durée</div>
          <div class="infk-v">${data.duration}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">🚆</div>
        <div>
          <div class="infk-k">Départ</div>
          <div class="infk-v">${data.fromStation}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">🚆</div>
        <div>
          <div class="infk-k">Arrivée</div>
          <div class="infk-v">${data.toStation}</div>
        </div>
      </div>

      <div class="infk-item">
        <div class="infk-ico">🎫</div>
        <div>
          <div class="infk-k">Classe</div>
          <div class="infk-v">${data.classLabel ?? '—'}</div>
        </div>
      </div>

    </div>
    <hr class="infk-hr" />
  `;

  card.innerHTML = head + grid;
  wrapper.appendChild(style);
  wrapper.appendChild(card);

  position === 'start' ? container.prepend(wrapper) : container.appendChild(wrapper);
  return wrapper;
}
