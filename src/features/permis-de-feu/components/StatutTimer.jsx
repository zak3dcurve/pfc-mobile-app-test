// components/StatutTimer.jsx
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const formatMMSS = (ms) => {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function StatutTimer({ row, initialStatus }) {
  const [remaining, setRemaining] = useState(0);

  // Détermine quel timestamp utiliser selon le statut
  const getTargetTime = () => {
    if (initialStatus === "fin_travaux") return row.timer_15min;
    if (initialStatus === "form_final_countdown") return row.timer_2h;
    if (initialStatus === "pause_dej_countdown") return row.timer_dejeuner_15min;
    return null;
  };

  useEffect(() => {
    const target = getTargetTime();
    if (!target) return;

    const targetTime = new Date(target).getTime();
    setRemaining(Math.max(0, targetTime - Date.now()));

    const interval = setInterval(() => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        clearInterval(interval);
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialStatus, row]);

  // Rendu des badges selon le statut
  switch (initialStatus) {
    case "termine":
      return <Badge className="bg-gray-500">Terminé</Badge>;
    case "fin_travaux":
      return <Badge className="bg-yellow-500">Fin Travaux {formatMMSS(remaining)}</Badge>;
    case "attente_form_15min":
      return <Badge className="bg-orange-500">En attente du formulaire 15 min</Badge>;
    case "form_final_countdown":
      return <Badge className="bg-blue-500">Form final {formatMMSS(remaining)}</Badge>;
    case "attente_form_final":
      return <Badge className="bg-red-500">En attente du formulaire final</Badge>;
    case "pause_dej_countdown":
      return <Badge className="bg-purple-500">Pause Déj {formatMMSS(remaining)}</Badge>;
    case "attente_form_dejeuner":
      return <Badge className="bg-orange-500">En attente du formulaire déjeuner</Badge>;
    case "pause":
      return <Badge className="bg-indigo-500">Pause</Badge>;
    case "en_cours":
      return <Badge className="bg-green-500">En cours</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
}