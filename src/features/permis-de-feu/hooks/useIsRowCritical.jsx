// src/hooks/useIsRowCritical.js
import { useTimerStatus } from "./useCountDown";

export function useIsRowCritical(rowId) {
  const t15 = useTimerStatus(rowId, "timer_15min", "form_15min");
  const t2h = useTimerStatus(rowId, "timer_2h", "form_2h");
  const tdj = useTimerStatus(rowId, "timer_dejeuner_15min", "form_15min_dejeuner");

  return (
    (t15.hasTimer && !t15.formDone && t15.remaining <= 300000 && t15.remaining > 0) ||
    (t2h.hasTimer && !t2h.formDone && t2h.remaining <= 300000 && t2h.remaining > 0) ||
    (tdj.hasTimer && !tdj.formDone && tdj.remaining <= 300000 && tdj.remaining > 0)
  );
}