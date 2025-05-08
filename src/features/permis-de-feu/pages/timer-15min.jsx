import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";

const PauseDejeunerTimer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fin de travail 15-min
  const [endTime, setEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timerFinished, setTimerFinished] = useState(false);
  const [timerNull, setTimerNull] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [form15Ended, setForm15Ended] = useState(false);

  // 2-hour
  const [timer2hStarted, setTimer2hStarted] = useState(false);
  const [endTime2h, setEndTime2h] = useState(null);
  const [remainingTime2h, setRemainingTime2h] = useState(null);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [finalName, setFinalName] = useState("");
  const [finalSurname, setFinalSurname] = useState("");

  // Pause déjeuner 15-min
  const [endTimeDej, setEndTimeDej] = useState(null);
  const [remainingTimeDej, setRemainingTimeDej] = useState(null);
  const [timerDejStarted, setTimerDejStarted] = useState(false);
  const [showFormDej, setShowFormDej] = useState(false);
  const [nameDej, setNameDej] = useState("");
  const [surnameDej, setSurnameDej] = useState("");
  const [lunchDisabled, setLunchDisabled] = useState(false);

  const [loading, setLoading] = useState(true);




  const [twentyMinEnd, setTwentyMinEnd] = useState(null);
  const [twentyMinLeft, setTwentyMinLeft] = useState(null);
  const [twentyMinStarted, setTwentyMinStarted] = useState(false);
  






  // Fetch or create row on mount
  useEffect(() => {
    const fetchState = async () => {
      setLoading(true);
      try {
        // ✅ Step 1: Try to get the row with maybeSingle (NO .order() or .limit())
        let { data, error } = await supabase
          .from("timer_end")
          .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h, 20min")
          .eq("pdf_id", id)
          .maybeSingle();
  
        // ✅ Step 2: If no data, try inserting a new row
        if (!data) {
          const { error: insertError } = await supabase
            .from("timer_end")
            .insert({ pdf_id: id });
  
          // If insertion failed for reason other than duplicate (unique constraint)
          if (insertError && insertError.code !== "23505") {
            throw insertError;
          }
  
          // ✅ Step 3: Fetch again after insert
          ({ data, error } = await supabase
            .from("timer_end")
            .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h")
            .eq("pdf_id", id)
            .maybeSingle());
        }
  
        // ✅ Step 4: Handle if still no data somehow
        if (!data) {
          console.warn("No data found even after insert");
          return;
        }
  
        // ✅ Final 2h form already filled
        if (data.form_2h) {
          navigate("/listpermisdefeu");
          return;
        }
  
        // ⏱️ 15-min end work timer
        if (data.timer_15min) {
          const ts = new Date(data.timer_15min).getTime();
          const delta = ts - Date.now();
          setTimerNull(false);
          if (delta > 0) {
            setEndTime(ts);
            setRemainingTime(delta);
          } else {
            setTimerFinished(true);
            if (!data.form_15min) setShowForm(true);
          }
        }
        if (data.form_15min) setForm15Ended(true);
  
        if (data.form_15min && !data["20min"]) {
          if (data.timer_15min) {
            const base = new Date(data.timer_15min).getTime();
            const twentyAfterFifteen = new Date(base + 20 * 60 * 1000).toISOString();
            await supabase
              .from("timer_end")
              .update({ "20min": twentyAfterFifteen })
              .eq("pdf_id", id);
            const ts20 = new Date(twentyAfterFifteen).getTime();
            setTwentyMinEnd(ts20);
            setTwentyMinLeft(ts20 - Date.now());
            setTwentyMinStarted(true);
          }
        } else if (data["20min"] && !data.form_2h) {
          const ts20 = new Date(data["20min"]).getTime();
          const left = ts20 - Date.now();
          if (left > 0) {
            setTwentyMinEnd(ts20);
            setTwentyMinLeft(left);
            setTwentyMinStarted(true);
          }
        }



        // ⏱️ 2h timer
        if (data.timer_2h) {
          const ts2 = new Date(data.timer_2h).getTime();
          const left2 = ts2 - Date.now();
          if (left2 > 0) {
            setTimer2hStarted(true);
            setEndTime2h(ts2);
            setRemainingTime2h(left2);
          } else {
            setShowFinalForm(true);
          }
        }
  
        // 🍽️ lunch
        if (data.form_15min_dejeuner) setLunchDisabled(true);
        if (data.timer_dejeuner_15min) {
          const ts3 = new Date(data.timer_dejeuner_15min).getTime();
          const left3 = ts3 - Date.now();
          if (left3 > 0) {
            setTimerDejStarted(true);
            setEndTimeDej(ts3);
            setRemainingTimeDej(left3);
          } else if (!data.form_15min_dejeuner) {
            setShowFormDej(true);
          }
        }
  
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchState();
  }, [id, navigate]);

  // 15-min Fin de travail interval
  useEffect(() => {
    if (!endTime) return;
    const iv = setInterval(() => {
      const left = endTime - Date.now();
      if (left <= 0) {
        clearInterval(iv);
        setRemainingTime(0);
        setTimerFinished(true);
        setShowForm(true);
      } else {
        setRemainingTime(left);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [endTime]);

  // 2-hour interval
  useEffect(() => {
    if (!endTime2h) return;
    const left2 = endTime2h - Date.now();
    if (left2 <= 0) {
      setTimer2hStarted(false);
      setShowFinalForm(true);
      return;
    }
    setRemainingTime2h(left2);
    const iv2 = setInterval(() => {
      const l2 = endTime2h - Date.now();
      if (l2 <= 0) {
        clearInterval(iv2);
        setRemainingTime2h(0);
        setTimer2hStarted(false);
        setShowFinalForm(true);
      } else {
        setRemainingTime2h(l2);
      }
    }, 1000);
    return () => clearInterval(iv2);
  }, [endTime2h]);

  // 15-min Pause déjeuner interval
  useEffect(() => {
    if (!endTimeDej) return;
    const left3 = endTimeDej - Date.now();
    if (left3 <= 0) {
      setTimerDejStarted(false);
      setShowFormDej(true);
      return;
    }
    setRemainingTimeDej(left3);
    const iv3 = setInterval(() => {
      const l3 = endTimeDej - Date.now();
      if (l3 <= 0) {
        clearInterval(iv3);
        setRemainingTimeDej(0);
        setTimerDejStarted(false);
        setShowFormDej(true);
      } else {
        setRemainingTimeDej(l3);
      }
    }, 1000);
    return () => clearInterval(iv3);
  }, [endTimeDej]);

  // Format helper
  const formatTime = ms => {
    const s = Math.floor(ms/1000),
          h = Math.floor(s/3600),
          m = Math.floor((s%3600)/60),
          sec = s%60;
    if (h) {
      return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
    }
    return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  };

  // Start both 15-min and 2-hour
  const handleFinTravail = async () => {
    if (!timerNull) return;
    const new15 = new Date(Date.now()+15*60*1000).toISOString();
    const new2h = new Date(Date.now()+2*3600*1000).toISOString();
    const { error } = await supabase
      .from("timer_end")
      .update({ timer_15min: new15, timer_2h: new2h })
      .eq("pdf_id", id);
    if (!error) {
      const ts15 = new Date(new15).getTime();
      setEndTime(ts15);
      setRemainingTime(ts15 - Date.now());
      setTimerNull(false);
      setTimerFinished(false);
      setShowForm(false);
      const ts2h = new Date(new2h).getTime();
      setEndTime2h(ts2h);
      setRemainingTime2h(ts2h - Date.now());
      setTimer2hStarted(true);
    }
  };

  // Start Pause déjeuner 15-min
  const handlePauseDejeuner = async () => {
    if (timerDejStarted || lunchDisabled) return;
    const newEnd = new Date(Date.now()+15*60*1000).toISOString();
    const { error } = await supabase
      .from("timer_end")
      .update({ timer_dejeuner_15min: newEnd })
      .eq("pdf_id", id);
    if (!error) {
      const ts = new Date(newEnd).getTime();
      setEndTimeDej(ts);
      setRemainingTimeDej(ts - Date.now());
      setTimerDejStarted(true);
      setShowFormDej(false);
    }
  };

  // Submit Fin de travail 15-min form
  const handleSubmit = async e => {
    e.preventDefault();
    if (!name || !surname) return alert("Remplissez nom & prénom");
    const { error } = await supabase
      .from("timer_end")
      .update({ form_15min: `${name} ${surname}` })
      .eq("pdf_id", id);
    if (!error) {
      setName("");
      setSurname("");
      setShowForm(false);
      setForm15Ended(true);
      setTimerNull(true);
    }
  };

  // Submit Pause déjeuner 15-min form
  const handleSubmitDej = async e => {
    e.preventDefault();
    if (!nameDej || !surnameDej) return alert("Remplissez nom & prénom");
    const { error } = await supabase
      .from("timer_end")
      .update({ form_15min_dejeuner: `${nameDej} ${surnameDej}` })
      .eq("pdf_id", id);
    if (!error) {
      setNameDej("");
      setSurnameDej("");
      setShowFormDej(false);
      setTimerDejStarted(false);
      setLunchDisabled(true);
    }
  };

  // Submit final 2-hour form → redirect
  const handleFinalFormSubmit = async e => {
    e.preventDefault();
    if (!finalName || !finalSurname) return alert("Remplissez nom & prénom");
    const { error } = await supabase
      .from("timer_end")
      .update({ form_2h: `${finalName} ${finalSurname}` })
      .eq("pdf_id", id);
    if (!error) navigate("/listpermisdefeu");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Fin Des Travaux</h1>

        {loading ? (
          <div className="text-gray-500">Chargement…</div>

        ) : showFinalForm ? (
          <form onSubmit={handleFinalFormSubmit} className="flex flex-col gap-3">
            <h2 className="font-semibold">Formulaire Final (2h)</h2>
            <input
              placeholder="Nom"
              value={finalName}
              onChange={e => setFinalName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              placeholder="Prénom"
              value={finalSurname}
              onChange={e => setFinalSurname(e.target.value)}
              className="border p-2 rounded"
            />
            <button className="bg-green-600 text-white px-4 py-2 rounded">
              Continuer
            </button>
          </form>

        ) : (!timerNull && !timerFinished && timer2hStarted && !form15Ended) ? (
          <div className="flex flex-col gap-2">
            <p className="text-lg">15 min: {formatTime(remainingTime)}</p>
            <p className="text-lg">2 h: {formatTime(remainingTime2h)}</p>
          </div>

        ) : (form15Ended && timer2hStarted) ? (
          <p className="text-lg">2 h: {formatTime(remainingTime2h)}</p>

        ) : showFormDej ? (
          <form onSubmit={handleSubmitDej} className="flex flex-col gap-3">
            <h2 className="font-semibold">Formulaire Déjeuner (15 min)</h2>
            <input
              placeholder="Nom"
              value={nameDej}
              onChange={e => setNameDej(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              placeholder="Prénom"
              value={surnameDej}
              onChange={e => setSurnameDej(e.target.value)}
              className="border p-2 rounded"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Soumettre
            </button>
          </form>

        ) : timerDejStarted ? (
          <p className="text-lg">Pause Déjeuner: {formatTime(remainingTimeDej)}</p>

        ) : timerNull ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={handlePauseDejeuner}
              disabled={timerDejStarted || lunchDisabled}
              className={
                `bg-blue-600 text-white px-4 py-2 rounded ` +
                ((timerDejStarted || lunchDisabled)
                  ? "opacity-50 cursor-not-allowed"
                  : "")
              }
            >
              Pause Déjeuner
            </button>
            <button
              onClick={handleFinTravail}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Fin de travail
            </button>
          </div>

        ) : (timerFinished && showForm) ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              placeholder="Nom"
              value={name}
              onChange={e => setName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              placeholder="Prénom"
              value={surname}
              onChange={e => setSurname(e.target.value)}
              className="border p-2 rounded"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Soumettre
            </button>
          </form>

        ) : (
          <p className="text-lg">Temps restant: {formatTime(remainingTime)}</p>
        )}
      </div>
    </div>
  );
};

export default PauseDejeunerTimer;
