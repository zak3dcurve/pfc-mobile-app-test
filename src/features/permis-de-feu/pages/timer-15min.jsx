import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useAuth } from "@/features/auth/utils/auth-context";




  const FormComponent = ({ 
    title, 
    date, setDate, 
    intervenant, setIntervenant,
    result, setResult,
      motif, setMotif,  // ✅ Add these
  equipements,    // ✅ Add this
  intervenants,   // ✅ Add this
    onSubmit,
    formType
  }) => (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-xl">{title}</h2>

      {/* Date */}
      <input 
        type="datetime-local" 
        value={date} 
        onChange={e => setDate(e.target.value)} 
        className="border p-2 rounded" 
        required 
      />

      {/* Equipement */}
      <div className="border p-2 rounded bg-gray-50">
      <strong>Équipement: </strong>
      {equipements.length > 0 ? equipements[0].name : "Chargement..."}
    </div>

      {/* Intervenant */}
      <select 
        value={intervenant} 
        onChange={e => setIntervenant(e.target.value)} 
        className="border p-2 rounded" 
        required
      >
        <option value="">Sélectionnez l'intervenant</option>
        {intervenants.map(person => (
          <option key={person.id} value={person.id}>{person.name}</option>
        ))}
      </select>

      {/* Result */}
      <select 
        value={result} 
        onChange={e => setResult(e.target.value)} 
        className="border p-2 rounded" 
        required
      >
        <option value="">Sélectionnez le résultat</option>
        <option value="RAS">RAS</option>
        <option value="Anomalie">Anomalie</option>
      </select>


          {result === "Anomalie" && (
      <textarea
        value={motif}
        onChange={e => setMotif(e.target.value)}
        placeholder="Décrivez le motif de l'anomalie..."
        className="border p-2 rounded min-h-[80px]"
        required
      />
    )}

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Soumettre le Rapport
      </button>
      
      {result === "Anomalie" && (
        <p className="text-orange-600 text-sm mt-2">
          ⚠️ Anomalie détectée - Les minuteurs redémarreront après soumission
        </p>
      )}
    </form>
  );
















const PauseDejeunerTimer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
    const { entreprise } = useAuth(); // Add this line

  const [loading, setLoading] = useState(true);
  const [timerId, setTimerId] = useState("");

  // State organization - group related states together
  // Timer states
  const [timerNull, setTimerNull] = useState(true);
  
  // 15-min end work timer
  const [endTime, setEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timerFinished, setTimerFinished] = useState(false);
  const [form15Ended, setForm15Ended] = useState(false);

  // 2-hour timer
  const [timer2hStarted, setTimer2hStarted] = useState(false);
  const [endTime2h, setEndTime2h] = useState(null);
  const [remainingTime2h, setRemainingTime2h] = useState(null);
  const [showFinalForm, setShowFinalForm] = useState(false);

  // Lunch break 15-min timer
  const [endTimeDej, setEndTimeDej] = useState(null);
  const [remainingTimeDej, setRemainingTimeDej] = useState(null);
  const [timerDejStarted, setTimerDejStarted] = useState(false);
  const [lunchDisabled, setLunchDisabled] = useState(false);
  
  // Fin pause state
  const [finPause, setFinPause] = useState(null);
  const [showFinPauseButton, setShowFinPauseButton] = useState(false);

  // Form visibility control
  const [showForm, setShowForm] = useState(false);
  const [showFormDej, setShowFormDej] = useState(false);

  // Data for forms
  const [equipements, setEquipements] = useState([]);
  const [intervenants, setIntervenants] = useState([]);

  // Form data - 15 min form
  const [firstDate, setFirstDate] = useState("");
  const [firstEquipement, setFirstEquipement] = useState("");
  const [firstIntervenant, setFirstIntervenant] = useState("");
  const [firstResult, setFirstResult] = useState("");
  const [firstMotif, setFirstMotif] = useState("");


  // Form data - lunch break form
  const [dejDate, setDejDate] = useState("");
  const [dejEquipement, setDejEquipement] = useState("");
  const [dejIntervenant, setDejIntervenant] = useState("");
  const [dejResult, setDejResult] = useState("");
  const [dejMotif, setDejMotif] = useState("");


  // Form data - 2h form
  const [finalDate, setFinalDate] = useState("");
  const [finalEquipement, setFinalEquipement] = useState("");
  const [finalIntervenant, setFinalIntervenant] = useState("");
  const [finalResult, setFinalResult] = useState("");
  const [finalMotif, setFinalMotif] = useState("");


  // Timer restart functions
  const restart15MinTimer = async () => {
    try {
      const new15 = new Date(Date.now() + 15*60*1000).toISOString();
      const { error } = await supabase
        .from("timer_end")
        .update({ timer_15min: new15 })
        .eq("pdf_id", id);
      
      if (!error) {
        const ts15 = new Date(new15).getTime();
        setEndTime(ts15);
        setRemainingTime(ts15 - Date.now());
        setTimerFinished(false);
        setShowForm(false);
        setForm15Ended(false);
        console.log("15-min timer restarted due to anomaly");
      } else {
        console.error("Error restarting 15-min timer:", error);
      }
    } catch (err) {
      console.error("Error in restart15MinTimer:", err);
    }
  };

  const restart2HTimer = async () => {
    try {
      const new2h = new Date(Date.now() + 2*3600*1000).toISOString();
      const { error } = await supabase
        .from("timer_end")
        .update({ timer_2h: new2h })
        .eq("pdf_id", id);
      
      if (!error) {
        const ts2h = new Date(new2h).getTime();
        setEndTime2h(ts2h);
        setRemainingTime2h(ts2h - Date.now());
        setShowFinalForm(false);
        console.log("2-hour timer restarted due to anomaly");
      } else {
        console.error("Error restarting 2-hour timer:", error);
      }
    } catch (err) {
      console.error("Error in restart2HTimer:", err);
    }
  };

  const restartLunchTimer = async () => {
    try {
      const newEnd = new Date(Date.now() + 15*60*1000).toISOString();
      const { error } = await supabase
        .from("timer_end")
        .update({ 
          timer_dejeuner_15min: newEnd,
          form_15min_dejeuner: null // Reset form status
        })
        .eq("pdf_id", id);
      
      if (!error) {
        const ts = new Date(newEnd).getTime();
        setEndTimeDej(ts);
        setRemainingTimeDej(ts - Date.now());
        setTimerDejStarted(true);
        setShowFormDej(false);
        setLunchDisabled(false);
        console.log("Lunch timer restarted due to anomaly");
      } else {
        console.error("Error restarting lunch timer:", error);
      }
    } catch (err) {
      console.error("Error in restartLunchTimer:", err);
    }
  };

  // Fetch or create row on mount
  useEffect(() => {
    const fetchState = async () => {
      setLoading(true);
      try {
        // Step 1: Try to get the row with maybeSingle
        let { data, error } = await supabase
          .from("timer_end")
          .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h, fin_pause, id")
          .eq("pdf_id", id)
          .maybeSingle();

        if (data) {
          setTimerId(data.id);  
        }

        // Step 2: If no data, try to insert a new row
        if (!data) {
          const { error: insertError } = await supabase
            .from("timer_end")
            .insert({ pdf_id: id });

          // Always fetch again after insert attempt
          ({ data, error } = await supabase
            .from("timer_end")
            .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h, fin_pause, id")
            .eq("pdf_id", id)
            .maybeSingle());

          if (!data) {
            console.error("Failed to create or fetch timer_end record");
            return;
          }
        }

        if (data) {
          setTimerId(data.id);  
        }

        // Final 2h form already filled with RAS - redirect
        if (data.form_2h === "done") {
          navigate("/listpermisdefeu");
          return;
        }

        // 15-min end work timer
        if (data.timer_15min) {
          const ts = new Date(data.timer_15min).getTime();
          const delta = ts - Date.now();
          setTimerNull(false);
          if (delta > 0) {
            setEndTime(ts);
            setRemainingTime(delta);
          } else {
            setTimerFinished(true);
            if (data.form_15min !== "done") setShowForm(true);
          }
        }
        if (data.form_15min === "done") setForm15Ended(true);

        // 2h timer
        if (data.timer_2h) {
          const ts2 = new Date(data.timer_2h).getTime();
          const left2 = ts2 - Date.now();
          if (left2 > 0) {
            setTimer2hStarted(true);
            setEndTime2h(ts2);
            setRemainingTime2h(left2);
          } else {
            setShowFinalForm(true);
            
            // Auto-submit 15min as non-fait when 2h expires
            if (data.form_15min !== "done") {
              await supabase
                .from("timer_end")
                .update({ form_15min: "non-fait" })
                .eq("pdf_id", id);
              setForm15Ended(true);
              setShowForm(false);
            }
          }
        }

        // Lunch break
        if (data.form_15min_dejeuner === "done") setLunchDisabled(true);
        if (data.timer_dejeuner_15min) {
          const ts3 = new Date(data.timer_dejeuner_15min).getTime();
          const left3 = ts3 - Date.now();
          if (left3 > 0) {
            setTimerDejStarted(true);
            setEndTimeDej(ts3);
            setRemainingTimeDej(left3);
          } else if (data.form_15min_dejeuner !== "done") {
            setShowFormDej(true);
          }
        }

        // Handle fin_pause state
        if (data.fin_pause) {
          setFinPause(data.fin_pause);
        } else if (data.form_15min_dejeuner === "done") {
          setShowFinPauseButton(true);
        }

        // Fetch equipment and intervenant data
        const { data: permisRecord, error: permisError } = await supabase
          .from("permis_de_feu")
          .select("lieu_id, resp_surveillance_id")
          .eq("id", id)
          .maybeSingle();

        if (permisError || !permisRecord) {
          console.warn("No permis_de_feu record found for this ID.");
        } else {
          const lieuId = permisRecord.lieu_id;
          const respId = permisRecord.resp_surveillance_id;

          // Fetch Equipements (Zones) filtered by lieu_id
          const { data: zonesData } = await supabase
            .from("zones")
            .select("id, name")
            .eq("id", lieuId);
          if (zonesData) setEquipements(zonesData);

          // Fetch Intervenants (Persons) filtered by resp_surveillance_id
if (entreprise?.id) {
  const { data: personsData } = await supabase
    .from("persons")
    .select("id, name")
    .eq("entreprise_id", entreprise.id);
  if (personsData) setIntervenants(personsData);
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
    if (!endTime || timerFinished) return;

    const iv = setInterval(() => {
      const now = Date.now();
      const left = endTime - now;
      if (left <= 0) {
        setTimerFinished(true);
        setShowForm(true);
        setRemainingTime(0);
      } else {
        setRemainingTime(left);
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [endTime, timerFinished]);

  // 2-hour interval
  useEffect(() => {
    if (!endTime2h) return;

    const iv = setInterval(async () => {
      const now = Date.now();
      const left = endTime2h - now;
      if (left <= 0) {
        setShowFinalForm(true);
        
        // Auto-submit 15min as non-fait when 2h expires
        if (!form15Ended) {
          try {
            await supabase
              .from("timer_end")
              .update({ form_15min: "non-fait" })
              .eq("pdf_id", id);
            setForm15Ended(true);
            setShowForm(false);
          } catch (err) {
            console.error("Error updating form_15min:", err);
          }
        }
        setRemainingTime2h(0);
      } else {
        if (!showForm && !showFormDej) {
          setRemainingTime2h(left);
        }
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [endTime2h, form15Ended, id, showForm, showFormDej]);

  // 15-min Pause déjeuner interval
  useEffect(() => {
    if (!endTimeDej || lunchDisabled) return;

    const iv = setInterval(() => {
      const now = Date.now();
      const left = endTimeDej - now;
      if (left <= 0 && !lunchDisabled) {
        setTimerDejStarted(false);
        setShowFormDej(true);
      }
      setRemainingTimeDej(Math.max(0, left));
    }, 1000);

    return () => clearInterval(iv);
  }, [endTimeDej, lunchDisabled]);

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
    try {
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
      } else {
        console.error("Error starting timers:", error);
      }
    } catch (err) {
      console.error("Error in handleFinTravail:", err);
    }
  };

  // Start Pause déjeuner 15-min
  const handlePauseDejeuner = async () => {
    if (timerDejStarted || lunchDisabled) return;
    try {
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
      } else {
        console.error("Error starting lunch timer:", error);
      }
    } catch (err) {
      console.error("Error in handlePauseDejeuner:", err);
    }
  };

  // Handle finishing lunch break
  const handleFinirPause = async () => {
    try {
      const finPauseTime = new Date().toISOString();
      const { error } = await supabase
        .from("timer_end")
        .update({ fin_pause: finPauseTime })
        .eq("pdf_id", id);
      
      if (!error) {
        setFinPause(finPauseTime);
        setShowFinPauseButton(false);
        setTimerNull(true);
        console.log("Lunch break ended successfully");
      } else {
        console.error("Error ending lunch break:", error);
        alert("Erreur lors de la fin de la pause.");
      }
    } catch (err) {
      console.error("Error in handleFinirPause:", err);
      alert("Une erreur s'est produite.");
    }
  };

  // Common function for form validation
const validateForm = (date, equipement, intervenant, result) => {
  if (!date || !equipement || !intervenant || !result) {
    alert("Veuillez remplir tous les champs.");
    return false;
  }
  return true;
};

  // Submit verification form with anomaly handling
const submitVerificationForm = async (date, type, equipement, intervenant, result, motif, formType, redirectAfter = true) => {
    try {
      // Insert into verification_form table
      const { error: insertError } = await supabase
        .from("verification_form")
        .insert({
          date,
          type,
          equipement,
          intervenant,
          result,
          motif: result === "Anomalie" ? motif : null,
          pdf_id: id,
          timer_end_id: timerId,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        alert("Erreur lors de la soumission.");
        return false;
      }

      // Handle anomaly vs RAS logic
      if (result === "Anomalie") {
        // Don't update timer_end status, restart timers instead
        if (formType === "15min") {
          await restart15MinTimer();
          // Also restart 2h timer when 15min has anomaly
          await restart2HTimer();
        } else if (formType === "dejeuner") {
          await restartLunchTimer();
        } else if (formType === "2h") {
          // Restart both timers for 2h anomaly
          await restart15MinTimer();
          await restart2HTimer();
        }
        
        // Clear form data
        if (formType === "15min") {
          setFirstDate("");
          setFirstEquipement("");
          setFirstIntervenant("");
          setFirstResult("");
        } else if (formType === "dejeuner") {
          setDejDate("");
          setDejEquipement("");
          setDejIntervenant("");
          setDejResult("");
        } else if (formType === "2h") {
          setFinalDate("");
          setFinalEquipement("");
          setFinalIntervenant("");
          setFinalResult("");
        }
        
        return true;
      } else if (result === "RAS") {
        // Normal flow - update status in timer_end table
        const updateField = 
          formType === "15min" ? "form_15min" : 
          formType === "dejeuner" ? "form_15min_dejeuner" : "form_2h";
        
        const { error: updateError } = await supabase
          .from("timer_end")
          .update({ [updateField]: "done" })
          .eq("pdf_id", id);

        if (updateError) {
          console.error("Update error:", updateError);
          alert("Erreur lors de la mise à jour.");
          return false;
        }

  if (formType === "2h" && result === "RAS") {
    const { error: statusError } = await supabase
      .from("permis_de_feu")
      .update({ status: "archived" })
      .eq("id", id);

    if (statusError) {
      console.error("Error updating permis_de_feu status:", statusError);
      // You might want to show an error message here
    }
  }


        
        if (redirectAfter && formType === "2h") {
          navigate("/listpermisdefeu");
        }





        
        return true;
      }
    } catch (err) {
      console.error("Error in submitVerificationForm:", err);
      alert("Une erreur s'est produite.");
      return false;
    }
  };

  // Submit 15-min form
  const handleSubmit = async e => {
    e.preventDefault();
    
const autoEquipement = equipements.length > 0 ? equipements[0].id : "";
if (!validateForm(firstDate, autoEquipement, firstIntervenant, firstResult)) {
  return;
}
    
    
    const success = await submitVerificationForm(
      firstDate, 
      "15min",
      autoEquipement, 
      firstIntervenant, 
      firstResult, 
        firstMotif,  // Add this

      "15min",
      false
    );
    
    if (success) {
      console.log("Successfully submitted 15-min form");
      if (firstResult === "RAS") {
        setShowForm(false);
        setForm15Ended(true);
        setTimerNull(true);
          setFirstMotif("");  // Add this

      }
      // If anomaly, timers are already restarted, just hide the form
      if (firstResult === "Anomalie") {
        setShowForm(false);
      }
    }
  };

  // Submit lunch break form
  const handleSubmitDej = async e => {
    e.preventDefault();
    
      const autoEquipement = equipements.length > 0 ? equipements[0].id : "";
  if (!validateForm(dejDate, autoEquipement, dejIntervenant, dejResult)) {
    return;
  }
    
    const success = await submitVerificationForm(
      dejDate, 
      "dejeuner 15min",
      autoEquipement, 
      dejIntervenant, 
      dejResult, 
        dejMotif,  // Add this

      "dejeuner",
      false
    );
    
    if (success) {
      console.log("Successfully submitted lunch form");
      if (dejResult === "RAS") {
        setShowFormDej(false);
        setTimerDejStarted(false);
        setLunchDisabled(true);
        if (!finPause) {
          setShowFinPauseButton(true);
        }
      }
      // If anomaly, timer is already restarted, just hide the form
      if (dejResult === "Anomalie") {
        setShowFormDej(false);
      }
        setDejMotif("");  // Add this

    }
  };

  // Submit 2h form
  const handleFinalForm = async e => {
    e.preventDefault();
    
    const autoEquipement = equipements.length > 0 ? equipements[0].id : "";
  if (!validateForm(finalDate, autoEquipement, finalIntervenant, finalResult)) {
    return;
  }
    
    const success = await submitVerificationForm(
      finalDate, 
      "2h",
      autoEquipement, 
      finalIntervenant, 
      finalResult, 
        finalMotif,  // Add this

      "2h",
      finalResult === "RAS" // Only redirect if RAS
    );
    
    if (success) {
      console.log("Successfully submitted final form");
      if (finalResult === "RAS") {
        setShowFinalForm(false);
        setTimer2hStarted(false);
        setEndTime2h(null);
        setRemainingTime2h(null);
      }
      // If anomaly, timers are already restarted, just hide the form
      if (finalResult === "Anomalie") {
        setShowFinalForm(false);
      }
        setFinalMotif("");  // Add this

    }
  };

  // Generic Form Component - reused for all forms


  // Improved renderContent function
  const renderContent = () => {
    if (loading) {
      return <div className="text-gray-500">Chargement…</div>;
    }

    // Final form has highest priority
    if (showFinalForm) {
      return (
        <FormComponent 
          title="Rapport de Fin"
          date={finalDate} setDate={setFinalDate}
          intervenant={finalIntervenant} setIntervenant={setFinalIntervenant}
          result={finalResult} setResult={setFinalResult}
            motif={finalMotif} setMotif={setFinalMotif}  // Add this
  equipements={equipements}      // ✅ Add this
  intervenants={intervenants}    // ✅ Add this
          onSubmit={handleFinalForm}
          formType="2h"
        />
      );
    }
    
    // Then lunch form
    if (showFormDej) {
      return (
        <FormComponent 
          title="Rapport du Pause"
          date={dejDate} setDate={setDejDate}
          intervenant={dejIntervenant} setIntervenant={setDejIntervenant}
          result={dejResult} setResult={setDejResult}
            motif={dejMotif} setMotif={setDejMotif}  // Add this
  equipements={equipements}      // ✅ Add this
  intervenants={intervenants}    // ✅ Add this
          onSubmit={handleSubmitDej}
          formType="dejeuner"
        />
      );
    }
    
    // Then 15-min form
    if (timerFinished && showForm && !form15Ended) {
      return (
        <FormComponent 
          title="Rapport du verification 15min"
          date={firstDate} setDate={setFirstDate}
          intervenant={firstIntervenant} setIntervenant={setFirstIntervenant}
          result={firstResult} setResult={setFirstResult}
            motif={firstMotif} setMotif={setFirstMotif}  // Add this
  equipements={equipements}      // ✅ Add this
  intervenants={intervenants}    // ✅ Add this
          onSubmit={handleSubmit}
          formType="15min"
        />
      );
    }
    
    // Show fin pause button if needed
    if (showFinPauseButton && !finPause) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-lg text-green-600">Pause déjeuner terminée avec succès!</p>
          <button
            onClick={handleFinirPause}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Finir la Pause
          </button>
        </div>
      );
    }
    
    // 15-min and 2h timers running together
    if (!timerNull && !timerFinished && timer2hStarted && !form15Ended) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-lg">15 min: {formatTime(remainingTime)}</p>
          <p className="text-lg">2 h: {formatTime(remainingTime2h)}</p>
        </div>
      );
    }
    
    // Only 2h timer running (15-min form already done)
    if (form15Ended && timer2hStarted && remainingTime2h) {
      return <p className="text-lg">2 h: {formatTime(remainingTime2h)}</p>;
    }
    
    // Lunch timer running
    if (timerDejStarted && remainingTimeDej) {
      return <p className="text-lg">Pause Déjeuner: {formatTime(remainingTimeDej)}</p>;
    }
     
    // Initial state - buttons
    if (timerNull) {
      return (
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
      );
    }
    
    // Default case - show remaining time for 15-min timer
    if (remainingTime) {
      return <p className="text-lg">Temps restant: {formatTime(remainingTime)}</p>;
    }
    
    // Failsafe
    return <p>État inconnu, veuillez rafraîchir la page.</p>;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Fin Des Travaux</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default PauseDejeunerTimer;
