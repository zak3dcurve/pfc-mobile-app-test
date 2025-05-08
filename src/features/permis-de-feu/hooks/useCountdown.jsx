// src/hooks/useCountdown.js
import { useState, useEffect } from "react";
import { supabase } from "@/features/auth/utils/supabase-client";

export function useTimerStatus(pdfId, timerField, formField) {
  const [status, setStatus] = useState({
    remaining: null,
    formDone: false,
    hasTimer: false
  });

  useEffect(() => {
    let iv;
    async function load() {
      const { data, error } = await supabase
        .from("timer_end")
        .select(`${timerField}, ${formField}`)
        .eq("pdf_id", pdfId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setStatus({ remaining: null, formDone: false, hasTimer: false });
        return;
      }

      const hasTimer = !!data[timerField];
      const formDone = !!data[formField];
      let remaining = null;

      if (hasTimer) {
        const end = new Date(data[timerField]).getTime();
        remaining = Math.max(0, end - Date.now());

        function tick() {
          const delta = end - Date.now();
          setStatus(s => ({
            ...s,
            remaining: delta > 0 ? delta : 0
          }));
          if (delta <= 0) clearInterval(iv);
        }
        tick();
        iv = setInterval(tick, 1000);
      }

      setStatus({ remaining, formDone, hasTimer });
    }

    load();
    return () => clearInterval(iv);
  }, [pdfId, timerField, formField]);

  return status;
}
