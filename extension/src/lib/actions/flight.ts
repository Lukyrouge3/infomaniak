export interface FlightSegment {
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
      weekday: "short",
      day: "numeric",
      month: "long",
    })} • ${d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })} → ${a.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Conteneur principal (carte)
  const card = document.createElement("div");
  card.className = "infk-flight-card";

  // Styles encapsulés via une balise <style> scoping par classe racine
  const style = document.createElement("style");
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
    .infk-icon{ width:22px; text-align:center; opacity:.9; line-height:1.2; font-size: 20px }
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

  const dateFormat1 = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "long",
    });
  };

  // Construction du contenu
  const segHtml = data.segments
    .map(
      (seg, i) => `
    <div class="infk-header">
      <div>
        <div class="infk-title">${seg.fromCode} → ${seg.toCode}</div>
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

    <div class="infk-grid">
      <div class="infk-item">
        <div class="infk-icon">🛫</div>
        <div>
          <div class="infk-k">De</div>
          <div class="infk-v" title="${seg.fromCode ?? ""}">${
        seg.fromCode ?? "—"
      }</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">🛬</div>
        <div>
          <div class="infk-k">À</div>
          <div class="infk-v" title="${seg.toCode ?? ""}">${
        seg.toCode ?? "—"
      }</div>
        </div>
      </div>
	  <div class="infk-item">
        <div class="infk-icon">🧾</div>
        <div>
          <div class="infk-k">N° de vol</div>
          <div class="infk-v">${seg.flightNumber ?? "—"}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⏱️</div>
        <div>
          <div class="infk-k">Décollage</div>
          <div class="infk-v">${new Date(seg.departure).toLocaleTimeString(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⏱️</div>
        <div>
          <div class="infk-k">Atterrissage</div>
          <div class="infk-v">${new Date(seg.arrival).toLocaleTimeString(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</div>
        </div>
      </div>
	  <div class="infk-item">
        <div class="infk-icon">🏢</div>
        <div>
          <div class="infk-k">Compagnie</div>
          <div class="infk-v">${seg.airline ?? "—"}</div>
        </div>
      </div>
      <div class="infk-item">
        <div class="infk-icon">⌚</div>
        <div>
          <div class="infk-k">Durée</div>
          <div class="infk-v">${seg.duration ?? "—"}</div>
        </div>
      </div>
    </div>
  `
    )
    .join('<hr class="infk-hr" />');

  // Bloc Passagers (une seule fois pour toute la carte)
  const passengersText = data.passengers?.length
    ? data.passengers
        .map((p) => `${p.lastname ?? ""} ${p.firstname ?? ""}`.trim())
        .join(", ")
    : "—";

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

  const headers = Array.from(
    card.querySelectorAll<HTMLDivElement>(".infk-header")
  );
  headers.forEach((h) => {
    const grid = h.nextElementSibling as HTMLElement | null;
    if (!grid || !grid.classList.contains("infk-grid")) return;

    h.setAttribute("role", "button");
    h.setAttribute("tabindex", "0");
    h.setAttribute("aria-expanded", "true"); // ouvert par défaut

    const toggle = () => {
      const expanded = h.getAttribute("aria-expanded") === "true";
      h.setAttribute("aria-expanded", String(!expanded));
      grid.hidden = expanded;
    };

    h.addEventListener("click", toggle);
    h.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  // Passagers : cliquer pour montrer/masquer la valeur
  const passengers = card.querySelector<HTMLElement>(".infk-passengers");
  if (passengers) {
    passengers.setAttribute("role", "button");
    passengers.setAttribute("tabindex", "0");
    passengers.setAttribute("aria-expanded", "true"); // ouvert par défaut

    const toggleP = () => {
      const expanded = passengers.getAttribute("aria-expanded") === "true";
      passengers.setAttribute("aria-expanded", String(!expanded));
    };

    passengers.addEventListener("click", toggleP);
    passengers.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleP();
      }
    });
  }
  // Injection
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "infk-flight-card-wrapper");
  wrapper.appendChild(style);
  wrapper.appendChild(card);
  position === "start"
    ? container.prepend(wrapper)
    : container.appendChild(wrapper);
  return wrapper;
}
