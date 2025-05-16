// src/components/StatutTimer.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTimerStatus } from "../hooks/useCountDown";


const formatMMSS = ms => {
  const s = Math.floor(ms/1000) % 60;
  const m = Math.floor(ms/60000);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
};

export default function StatutTimer({ row }) {
  const t15 = useTimerStatus(row.id, "timer_15min",          "form_15min");
  const t2h = useTimerStatus(row.id, "timer_2h",              "form_2h");
  const tdj= useTimerStatus(row.id, "timer_dejeuner_15min",   "form_15min_dejeuner");
  const now = Date.now();

  // 1) 15-min still running?
  if (t15.hasTimer && !t15.formDone && t15.remaining > 0) {
    return <Badge>Fin Travaux {formatMMSS(t15.remaining)}</Badge>;
  }
  // 1b) 15-min expired, waiting on its form
  if (t15.hasTimer && !t15.formDone && t15.remaining === 0) {
    return <Badge>En attente du formulaire 15 min</Badge>;
  }

  // 2) 2-h still running (only after 15-min form done)
  if (t15.formDone && t2h.hasTimer && !t2h.formDone && t2h.remaining > 0) {
    return <Badge>Form final {formatMMSS(t2h.remaining)}</Badge>;
  }
  // 2b) 2-h expired, waiting on its form
  if (t15.formDone && t2h.hasTimer && !t2h.formDone && t2h.remaining === 0) {
    return <Badge>En attente du formulaire final</Badge>;
  }

  // 3) Lunch break (only if both above done or not started)
  if (
    (t15.formDone || !t15.hasTimer) &&
    (t2h.formDone  || !t2h.hasTimer) &&
    tdj.hasTimer &&
    !tdj.formDone &&
    tdj.remaining > 0
  ) {
    return <Badge>Pause Déj {formatMMSS(tdj.remaining)}</Badge>;
  }
  // 3b) lunch expired, waiting on its form
  if (
    (t15.formDone || !t15.hasTimer) &&
    (t2h.formDone  || !t2h.hasTimer) &&
    tdj.hasTimer &&
    !tdj.formDone &&
    tdj.remaining === 0
  ) {
    return <Badge>En attente du formulaire déjeuner</Badge>;
  }


  if (
    (!t15.formDone || !t15.hasTimer) &&
    (!t2h.formDone  || !t2h.hasTimer)
  ) {
    return <Badge>En cours</Badge>;
  }


  // 4) fallback
  return <Badge>Terminé</Badge>;
}