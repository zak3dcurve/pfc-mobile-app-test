// utils/statusCalculator.js
export const calculateRowStatus = (row) => {
  const now = Date.now();

  const t15_end = row.timer_15min ? new Date(row.timer_15min).getTime() : null;
  const t2h_end = row.timer_2h ? new Date(row.timer_2h).getTime() : null;
  const tdj_end = row.timer_dejeuner_15min ? new Date(row.timer_dejeuner_15min).getTime() : null;

  const form15Done = !!row.form_15min;
  const form2hDone = !!row.form_2h;
  const formDjDone = !!row.form_15min_dejeuner;
  
  const isInPause = formDjDone && tdj_end && (!row.fin_pause || row.fin_pause === null);

  // Si fin_pause est rempli, c'est terminé
  if (row.fin_pause) return "termine";

  // Logique 15 min
  if (t15_end) {
    if (!form15Done && t15_end > now) return "fin_travaux";
    if (!form15Done && t15_end <= now) return "attente_form_15min";
  }

  // Logique 2H (form final)
  if (form15Done && t2h_end) {
    if (!form2hDone && t2h_end > now) return "form_final_countdown";
    if (!form2hDone && t2h_end <= now) return "attente_form_final";
  }

  // Logique déjeuner
  if ((form15Done || !t15_end) && (form2hDone || !t2h_end) && tdj_end) {
    if (!formDjDone && tdj_end > now) return "pause_dej_countdown";
    if (!formDjDone && tdj_end <= now) return "attente_form_dejeuner";
  }

  if (isInPause) return "pause";
  
  // Par défaut: en cours si pas de formulaires complétés
  if ((!form15Done || !t15_end) && (!form2hDone || !t2h_end)) return "en_cours";
  
  return "termine";
};