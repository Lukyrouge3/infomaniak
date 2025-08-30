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
		//renderInfkTrainCard(bloc, 'start'); // apparaît en tête
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
export interface Passenger {
  lastname?: string;
  firstname?: string;
}
export interface FlightItinerary {
  segments: FlightSegment[];
  confirmationCode?: string;
  passengers?: Passenger[];
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
    passengers: [
      { lastname: 'Gajdov', firstname: 'Toma' }
    ],
  };

  // Conteneur principal (carte)
  const card = document.createElement('div');
  card.className = 'infk-flight-card';

  // Styles (layout en GRID + zone de validation en bas à droite)
  const style = document.createElement('style');
  style.textContent = `
    .infk-flight-card{
      width:100%; box-sizing:border-box; border:1px solid #e5e7eb; border-radius:12px;
      background:#fff; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; color:#111827;
      box-shadow:0 1px 2px rgba(0,0,0,.04); padding:16px; margin:12px 0;
    }
    .infk-header{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:10px; }
    .infk-title{ font-weight:600; font-size:1.05rem; line-height:1.2; }
    .infk-subtitle{ color:#6b7280; font-size:.95rem; margin-top:2px; }
    .infk-badge{
      display:inline-block; padding:2px 8px; border:1px solid #e5e7eb; border-radius:999px;
      font-size:.8rem; color:#374151; background:#f9fafb;
    }

    /* GRID corps de segment */
    .infk-grid{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(220px,1fr));
      gap:18px 32px;
      align-items:start;
      padding:6px 0 2px;
    }
    .infk-item{ display:flex; gap:10px; align-items:flex-start; }
    .infk-icon{ width:22px; text-align:center; opacity:.9; line-height:1.2; }
    .infk-k{ font-size:.85rem; color:#6b7280; }
    .infk-v{ font-weight:600; font-size:.98rem; margin-top:2px; }

    .infk-hr{ border:none; border-top:1px solid #f1f5f9; margin:14px 0 10px; }

    /* Passagers en dehors des segments (après tous les segments) */
    .infk-passengers{ display:flex; gap:10px; align-items:flex-start; margin:6px 0 2px; }
    .infk-passengers .infk-icon{ width:22px; text-align:center; opacity:.9; }

    /* Zone de validation (bas/droite) */
    .infk-validate-wrap{ display:flex; justify-content:flex-end; align-items:center; gap:8px; padding-top:8px; }
    .infk-validate-label{ color:#6b7280; font-size:.9rem; margin-right:4px; }
    .infk-thumb{ width:36px; height:36px; border:1px solid #e5e7eb; border-radius:999px; background:#fff;
      display:inline-flex; align-items:center; justify-content:center; cursor:pointer;
      transition:background .15s, border-color .15s, transform .05s;
    }
    .infk-thumb:hover{ background:#f9fafb; }
    .infk-thumb:active{ transform:scale(.96); }
    .infk-thumb[aria-pressed="true"]{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15); }
    .infk-thumb[data-vote="down"][aria-pressed="true"]{ border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.15); }
  
	
	
  /* --- Dépliants --- */
  .infk-header{ cursor:pointer; position:relative; padding-right:26px; }
  .infk-header::after{
    content:'▾'; position:absolute; right:0; top:8px; font-size:14px; color:#6b7280; 
    transition:transform .15s ease;
  }
  .infk-header[aria-expanded="false"]::after{ transform:rotate(-90deg); }
  .infk-grid[hidden]{ display:none !important; }

  .infk-passengers{ cursor:pointer; position:relative; padding-right:26px; }
  .infk-passengers::after{
    content:'▾'; position:absolute; right:0; top:0; font-size:14px; color:#6b7280; 
    transition:transform .15s ease;
  }
  .infk-passengers[aria-expanded="false"]::after{ transform:rotate(-90deg); }
  /* On ne masque que la valeur quand replié, on garde le label visible */
  .infk-passengers[aria-expanded="false"] .infk-v{ display:none !important; }
`;

  // Construction du contenu : chaque segment = header + GRID
  const segHtml = data.segments.map((seg, i) => `
    <div class="infk-header">
      <div>
        <div class="infk-title">${seg.title}</div>
        <div class="infk-subtitle">${seg.dateLabel}</div>
      </div>
      ${i === 0 && data.confirmationCode ? `<span class="infk-badge" title="Code de réservation">Code de confirmation : ${data.confirmationCode}</span>` : ``}
    </div>

    <div class="infk-grid">
      <div class="infk-item">
        <div class="infk-icon">🛫</div>
        <div>
          <div class="infk-k">De</div>
          <div class="infk-v" title="${seg.fromCode ?? ''}">${seg.fromCode ?? '—'}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">🛬</div>
        <div>
          <div class="infk-k">À</div>
          <div class="infk-v" title="${seg.toCode ?? ''}">${seg.toCode ?? '—'}</div>
        </div>
      </div>
	  <div class="infk-item">
        <div class="infk-icon">🧾</div>
        <div>
          <div class="infk-k">N° de vol</div>
          <div class="infk-v">${seg.flightNumber ?? '—'}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⏱️</div>
        <div>
          <div class="infk-k">Décollage</div>
          <div class="infk-v">${seg.departure ?? '—'}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⏱️</div>
        <div>
          <div class="infk-k">Atterrissage</div>
          <div class="infk-v">${seg.arrival ?? '—'}</div>
        </div>
      </div>
	  <div class="infk-item">
        <div class="infk-icon">🏢</div>
        <div>
          <div class="infk-k">Compagnie</div>
          <div class="infk-v">${seg.airline ?? '—'}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⌚</div>
        <div>
          <div class="infk-k">Durée</div>
          <div class="infk-v">${seg.duration ?? '—'}</div>
        </div>
      </div>
    </div>
  `).join('<hr class="infk-hr" />');

  // Bloc Passagers (une seule fois pour toute la carte)
  const passengersText =
    data.passengers?.length
      ? data.passengers.map(p => `${p.lastname ?? ''} ${p.firstname ?? ''}`.trim()).join(', ')
      : '—';

  const passengersBlock = `
    <hr class="infk-hr" />
    <div class="infk-passengers">
      <div class="infk-icon">👤</div>
      <div>
        <div class="infk-k">Passager(s)</div>
        <div class="infk-v">${passengersText}</div>
      </div>
    </div>
  `;

  // Zone de validation (bas/droite) avec note "Est-ce correcte ?"
  const validate = `
    <div class="infk-validate-wrap" role="group" aria-label="Valider ces informations">
      <span class="infk-validate-label">Est-ce correcte&nbsp;?</span>
      <button class="infk-thumb" data-vote="up" aria-pressed="false" title="Oui, c’est correct">👍</button>
      <button class="infk-thumb" data-vote="down" aria-pressed="false" title="Non, c’est incorrect">👎</button>
    </div>
  `;

  card.innerHTML = `${segHtml}${passengersBlock}${validate}`;

  const headers = Array.from(card.querySelectorAll<HTMLDivElement>('.infk-header'));
headers.forEach((h) => {
  const grid = h.nextElementSibling as HTMLElement | null;
  if (!grid || !grid.classList.contains('infk-grid')) return;

  h.setAttribute('role', 'button');
  h.setAttribute('tabindex', '0');
  h.setAttribute('aria-expanded', 'true'); // ouvert par défaut

  const toggle = () => {
    const expanded = h.getAttribute('aria-expanded') === 'true';
    h.setAttribute('aria-expanded', String(!expanded));
    grid.hidden = expanded;
  };

  h.addEventListener('click', toggle);
  h.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// Passagers : cliquer pour montrer/masquer la valeur
const passengers = card.querySelector<HTMLElement>('.infk-passengers');
if (passengers) {
  passengers.setAttribute('role', 'button');
  passengers.setAttribute('tabindex', '0');
  passengers.setAttribute('aria-expanded', 'true'); // ouvert par défaut

  const toggleP = () => {
    const expanded = passengers.getAttribute('aria-expanded') === 'true';
    passengers.setAttribute('aria-expanded', String(!expanded));
  };

  passengers.addEventListener('click', toggleP);
  passengers.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleP(); }
  });
}

  // Injection
  const wrapper = document.createElement('div');
  wrapper.appendChild(style);
  wrapper.appendChild(card);
  position === 'start' ? container.prepend(wrapper) : container.appendChild(wrapper);
  return wrapper;
}


/* 
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
    title: 'Renens VD – Basel SBB',
    dateRangeLabel: 'ven. 13 juin • 10:41 – 12:18',
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
      ${data.confirmationNumber ? `<span class="infk-badge" title="Code de réservation">Code de confirmation : ${data.confirmationNumber}</span>` : ``}
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
        <div class="infk-ico"></div>
        <div>
          <div class="infk-k"></div>
          <div class="infk-v"></div>
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
        <div class="infk-ico">🎫</div>
        <div>
          <div class="infk-k">Classe</div>
          <div class="infk-v">${data.classLabel ?? '—'}</div>
        </div>
      </div>

    </div>
    <hr class="infk-hr" />
  `;

  const footer = `
	`;

  card.innerHTML = head + grid + footer;
  wrapper.appendChild(style);
  wrapper.appendChild(card);

  position === 'start' ? container.prepend(wrapper) : container.appendChild(wrapper);
  return wrapper;
}
 */