import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";

const PauseDejeunerTimer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // 20-min grace period after 15-min timer (1 min for testing)
  const [twentyMinEnd, setTwentyMinEnd] = useState(null);
  const [twentyMinLeft, setTwentyMinLeft] = useState(null);
  const [twentyMinStarted, setTwentyMinStarted] = useState(false);

  // 2-hour timer
  const [timer2hStarted, setTimer2hStarted] = useState(false);
  const [endTime2h, setEndTime2h] = useState(null);
  const [remainingTime2h, setRemainingTime2h] = useState(null);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [finalFormTimeoutEnd, setFinalFormTimeoutEnd] = useState(null);
  const [finalFormTimeLeft, setFinalFormTimeLeft] = useState(null);

  // Lunch break 15-min timer
  const [endTimeDej, setEndTimeDej] = useState(null);
  const [remainingTimeDej, setRemainingTimeDej] = useState(null);
  const [timerDejStarted, setTimerDejStarted] = useState(false);
  const [lunchDisabled, setLunchDisabled] = useState(false);
  const [lunchFormTimeoutEnd, setLunchFormTimeoutEnd] = useState(null);
  const [lunchFormTimeLeft, setLunchFormTimeLeft] = useState(null);

  // Form visibility control
  const [showForm, setShowForm] = useState(false);
  const [showFormDej, setShowFormDej] = useState(false);

  // Data for forms
  const [equipements, setEquipements] = useState([]);
  const [intervenants, setIntervenants] = useState([]);

  // Form data - 15 min form
  const [firstDate, setFirstDate] = useState("");
  const [firstType, setFirstType] = useState("");
  const [firstEquipement, setFirstEquipement] = useState("");
  const [firstIntervenant, setFirstIntervenant] = useState("");
  const [firstResult, setFirstResult] = useState("");

  // Form data - lunch break form
  const [dejDate, setDejDate] = useState("");
  const [dejType, setDejType] = useState("");
  const [dejEquipement, setDejEquipement] = useState("");
  const [dejIntervenant, setDejIntervenant] = useState("");
  const [dejResult, setDejResult] = useState("");

  // Form data - 2h form
  const [finalDate, setFinalDate] = useState("");
  const [finalType, setFinalType] = useState("");
  const [finalEquipement, setFinalEquipement] = useState("");
  const [finalIntervenant, setFinalIntervenant] = useState("");
  const [finalResult, setFinalResult] = useState("");

  // Fetch or create row on mount
  useEffect(() => {
    const fetchState = async () => {
      setLoading(true);
      try {
        // Step 1: Try to get the row with maybeSingle
        let { data, error } = await supabase
          .from("timer_end")
          .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h, 20min, 20minfordej, 20minfor2h, id")
          .eq("pdf_id", id)
          .maybeSingle();

        if (data) {
          setTimerId(data.id);  
        }

        // Step 2: If no data, insert a new row
        if (!data) {
          const { error: insertError } = await supabase
            .from("timer_end")
            .insert({ pdf_id: id });

          // If insertion failed for reason other than duplicate constraint
          if (insertError && insertError.code !== "23505") {
            throw insertError;
          }

          // Step 3: Fetch again after insert
          ({ data, error } = await supabase
            .from("timer_end")
            .select("timer_15min, form_15min, timer_2h, timer_dejeuner_15min, form_15min_dejeuner, form_2h, 20min, 20minfordej, 20minfor2h, id")
            .eq("pdf_id", id)
            .maybeSingle());
        }

        // Step 4: Handle if still no data somehow
        if (!data) {
          console.warn("No data found even after insert");
          return;
        }

        // Final 2h form already filled - redirect
        if (data.form_2h) {
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
            if (!data.form_15min) setShowForm(true);
          }
        }
        if (data.form_15min) setForm15Ended(true);

        // 20-min grace period
        if (data.form_15min && !data["20min"]) {
          if (data.timer_15min) {
            const base = new Date(data.timer_15min).getTime();
            const twentyAfterFifteen = new Date(base + 1 * 60 * 1000).toISOString(); // 1 min for testing
            await supabase
              .from("timer_end")
              .update({ "20min": twentyAfterFifteen })
              .eq("pdf_id", id);
            const ts20 = new Date(twentyAfterFifteen).getTime();
            setTwentyMinEnd(ts20);
            setTwentyMinLeft(ts20 - Date.now());
            setTwentyMinStarted(true);
            console.log("Started 20min grace period from DB initialization", twentyAfterFifteen);
          }
        } else if (data["20min"] && !data.form_2h) {
          const ts20 = new Date(data["20min"]).getTime();
          const left = ts20 - Date.now();
          if (left > 0) {
            setTwentyMinEnd(ts20);
            setTwentyMinLeft(left);
            setTwentyMinStarted(true);
            console.log("Restored existing 20min from DB", data["20min"], "time left:", left/1000, "s");
          }
        }

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
            
            // Set up 20minfor2h grace period if needed
            if (!data.form_2h && !data["20minfor2h"]) {
              const newTimeout = new Date(Date.now() + 1 * 60 * 1000).toISOString(); // 1 min for testing
              await supabase
                .from("timer_end")
                .update({ "20minfor2h": newTimeout })
                .eq("pdf_id", id);
              
              const timeoutTs = new Date(newTimeout).getTime();
              setFinalFormTimeoutEnd(timeoutTs);
              setFinalFormTimeLeft(timeoutTs - Date.now());
            } else if (!data.form_2h && data["20minfor2h"]) {
              const timeoutTs = new Date(data["20minfor2h"]).getTime();
              const leftTimeout = timeoutTs - Date.now();
              if (leftTimeout > 0) {
                setFinalFormTimeoutEnd(timeoutTs);
                setFinalFormTimeLeft(leftTimeout);
              }
            }
          }
        }

        // Lunch break
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
            
            // Set up 20minfordej grace period if needed
            if (!data.form_15min_dejeuner && !data["20minfordej"]) {
              const newTimeout = new Date(Date.now() + 1 * 60 * 1000).toISOString(); // 1 min for testing
              await supabase
                .from("timer_end")
                .update({ "20minfordej": newTimeout })
                .eq("pdf_id", id);
              
              const timeoutTs = new Date(newTimeout).getTime();
              setLunchFormTimeoutEnd(timeoutTs);
              setLunchFormTimeLeft(timeoutTs - Date.now());
            } else if (!data.form_15min_dejeuner && data["20minfordej"]) {
              const timeoutTs = new Date(data["20minfordej"]).getTime();
              const leftTimeout = timeoutTs - Date.now();
              if (leftTimeout > 0) {
                setLunchFormTimeoutEnd(timeoutTs);
                setLunchFormTimeLeft(leftTimeout);
              }
            }
          }
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
          const { data: personsData } = await supabase
            .from("persons")
            .select("id, name")
            .eq("id", respId);
          if (personsData) setIntervenants(personsData);
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

    const iv = setInterval(async () => {
      const now = Date.now();
      const graceEndTime = endTime + 1 * 60 * 1000;

      if (now >= graceEndTime && !form15Ended) {
        // Automatically mark as "non-fait"
        try {
          await supabase
            .from("timer_end")
            .update({ form_15min: "non-fait" })
            .eq("pdf_id", id);

          setForm15Ended(true);
          setShowForm(false);
          setTimerNull(true);
        } catch (err) {
          console.error("Error updating form_15min:", err);
        }
      } else {
        const left = endTime - now;
        if (left <= 0) {
          setTimerFinished(true);
          setShowForm(true);
        
          // Start 20-Min Countdown if Not Already Started
          if (!twentyMinEnd && !twentyMinStarted) {
            const newTwentyMinEnd = Date.now() + 1 * 60 * 1000; // 1 minute for testing
            setTwentyMinEnd(newTwentyMinEnd);
            setTwentyMinStarted(true);
            setTwentyMinLeft(1 * 60 * 1000); // 1 minute in ms for testing
            console.log("Starting 20min from 15min expiration", new Date(newTwentyMinEnd).toISOString());
        
            try {
              await supabase
                .from("timer_end")
                .update({ "20min": new Date(newTwentyMinEnd).toISOString() })
                .eq("pdf_id", id);
            } catch (err) {
              console.error("Error updating 20min:", err);
            }
          }
        }
        setRemainingTime(Math.max(0, left));
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [endTime, form15Ended, id, twentyMinEnd, twentyMinStarted]);

  // Unified 20-minute grace period logic
  // 1. Start the 20-min countdown when form is shown
  useEffect(() => {
    // Only start a new 20-min timer if the form is shown and timer hasn't been started yet
    if (!showForm || twentyMinStarted || form15Ended) return;

    console.log("Starting 20-min countdown for form submission from showForm");
    const newTwentyMinEnd = Date.now() + 1 * 60 * 1000; // 1 minute for testing
    setTwentyMinEnd(newTwentyMinEnd);
    setTwentyMinStarted(true);
    setTwentyMinLeft(1 * 60 * 1000); // 1 minute in ms for testing

    // Update the 20min timestamp in the database
    const updateDB = async () => {
      try {
        await supabase
          .from("timer_end")
          .update({ "20min": new Date(newTwentyMinEnd).toISOString() })
          .eq("pdf_id", id);
        console.log("Updated 20min timestamp in database", new Date(newTwentyMinEnd).toISOString());
      } catch (error) {
        console.error("Failed to update 20min timestamp:", error);
      }
    };
    updateDB();
  }, [showForm, twentyMinStarted, id, form15Ended]);

  // 2. Single interval to handle the countdown and auto-submission
  useEffect(() => {
    // Only run if we have an end time and the form hasn't been submitted yet
    if (!twentyMinEnd || form15Ended) {
      console.log("Skipping 20min countdown - no end time or form already ended", 
                  "twentyMinEnd:", twentyMinEnd, 
                  "form15Ended:", form15Ended);
      return;
    }

    console.log("Running 20-min countdown interval", new Date(twentyMinEnd).toISOString());
    const iv = setInterval(async () => {
      const now = Date.now();
      const left = twentyMinEnd - now;
      
      // Prevent negative values
      const adjustedLeft = Math.max(0, left);
      console.log("20-min countdown: Time left:", Math.round(adjustedLeft/1000), "seconds");
      setTwentyMinLeft(adjustedLeft);

      // Time's up - auto-submit as "non-fait" if form hasn't been submitted yet
      if (left <= 0) {
        console.log("20-min countdown ended, checking if form needs auto-submission");
        try {
          // Check current form status
          const { data } = await supabase
            .from("timer_end")
            .select("form_15min")
            .eq("pdf_id", id)
            .maybeSingle();

          // Only auto-submit if form hasn't been submitted yet
          if (data && !data.form_15min) {
            console.log("Auto-submitting form as non-fait");
            await supabase
              .from("timer_end")
              .update({ form_15min: "non-fait" })
              .eq("pdf_id", id);

            // Update local state
            setForm15Ended(true);
            setShowForm(false);
            setTimerNull(true);
            
            // If 2h timer was started, show that
            if (timer2hStarted) {
              console.log("Moving to 2h timer display");
            }
          } else {
            console.log("Form already submitted, no need for auto-submission", data);
          }
        } catch (error) {
          console.error("Error during auto-submission:", error);
        }
        
        // Clear the interval once we've processed the time expiration
        clearInterval(iv);
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [twentyMinEnd, form15Ended, id, timer2hStarted]);

  // 2-hour interval
  useEffect(() => {
    if (!endTime2h) return;

    const iv = setInterval(async () => {
      const now = Date.now();
      const graceEndTime2h = endTime2h + 1 * 60 * 1000;

      if (now >= graceEndTime2h && !showFinalForm) {
        try {
          await supabase
            .from("timer_end")
            .update({ form_2h: "non-fait" })
            .eq("pdf_id", id);

          setShowFinalForm(false);
          navigate("/listpermisdefeu");
        } catch (err) {
          console.error("Error updating form_2h:", err);
        }
      } else {
        const left = endTime2h - now;
        if (left <= 0) {
          setShowFinalForm(true);
          
          // Start final form timeout if not already started
          if (!finalFormTimeoutEnd) {
            const newTimeout = Date.now() + 1 * 60 * 1000; // 1 minute for testing
            setFinalFormTimeoutEnd(newTimeout);
            setFinalFormTimeLeft(1 * 60 * 1000);
            
            try {
              await supabase
                .from("timer_end")
                .update({ "20minfor2h": new Date(newTimeout).toISOString() })
                .eq("pdf_id", id);
              console.log("Started final form timeout", new Date(newTimeout).toISOString());
            } catch (err) {
              console.error("Error updating 20minfor2h:", err);
            }
          }
        }
        setRemainingTime2h(Math.max(0, left));
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [endTime2h, showFinalForm, id, navigate, finalFormTimeoutEnd]);

  // 15-min Pause déjeuner interval
  useEffect(() => {
    if (!endTimeDej) return;

    const iv = setInterval(async () => {
      const now = Date.now();
      const graceEndTimeDej = endTimeDej + 1 * 60 * 1000;

      if (now >= graceEndTimeDej && !lunchDisabled) {
        try {
          await supabase
            .from("timer_end")
            .update({ form_15min_dejeuner: "non-fait" })
            .eq("pdf_id", id);

          setLunchDisabled(true);
          setShowFormDej(false);
        } catch (err) {
          console.error("Error updating form_15min_dejeuner:", err);
        }
      } else {
        const left = endTimeDej - now;
        if (left <= 0) {
          setTimerDejStarted(false);
          setShowFormDej(true);
          
          // Start lunch form timeout if not already started
          if (!lunchFormTimeoutEnd) {
            const newTimeout = Date.now() + 1 * 60 * 1000; // 1 minute for testing
            setLunchFormTimeoutEnd(newTimeout);
            setLunchFormTimeLeft(1 * 60 * 1000);
            
            try {
              await supabase
                .from("timer_end")
                .update({ "20minfordej": new Date(newTimeout).toISOString() })
                .eq("pdf_id", id);
              console.log("Started lunch form timeout", new Date(newTimeout).toISOString());
            } catch (err) {
              console.error("Error updating 20minfordej:", err);
            }
          }
        }
        setRemainingTimeDej(Math.max(0, left));
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [endTimeDej, lunchDisabled, id, lunchFormTimeoutEnd]);

  // Updated timer for lunch form auto-submission to use DB value
  useEffect(() => {
    if (!showFormDej || lunchDisabled || !lunchFormTimeoutEnd) return;
    
    console.log("Running lunch form countdown from DB timer");
    
    const iv = setInterval(async () => {
      const now = Date.now();
      const left = lunchFormTimeoutEnd - now;
      
      // Prevent negative values
      const adjustedLeft = Math.max(0, left);
      console.log("Lunch form timeout: Time left:", Math.round(adjustedLeft/1000), "seconds");
      setLunchFormTimeLeft(adjustedLeft);
      
      if (left <= 0) {
        console.log("Lunch form timeout - auto-submitting as non-fait");
        try {
          // Check current form status
          const { data } = await supabase
            .from("timer_end")
            .select("form_15min_dejeuner")
            .eq("pdf_id", id)
            .maybeSingle();
            
          if (data && !data.form_15min_dejeuner) {
            await supabase
              .from("timer_end")
              .update({ form_15min_dejeuner: "non-fait" })
              .eq("pdf_id", id);
              
            setLunchDisabled(true);
            setShowFormDej(false);
            setTimerDejStarted(false);
          }
        } catch (error) {
          console.error("Error during lunch form auto-submission:", error);
        }
        clearInterval(iv);
      }
    }, 1000);
    
    return () => clearInterval(iv);
  }, [showFormDej, id, lunchDisabled, lunchFormTimeoutEnd]);
  
  // Updated timer for final form auto-submission to use DB value
  useEffect(() => {
    if (!showFinalForm || !finalFormTimeoutEnd) return;
    
    console.log("Running final form countdown from DB timer");
    
    const iv = setInterval(async () => {
      const now = Date.now();
      const left = finalFormTimeoutEnd - now;
      
      // Prevent negative values
      const adjustedLeft = Math.max(0, left);
      console.log("Final form timeout: Time left:", Math.round(adjustedLeft/1000), "seconds");
      setFinalFormTimeLeft(adjustedLeft);
      
      if (left <= 0) {
        console.log("Final form timeout - auto-submitting as non-fait");
        try {
          // Check current form status
          const { data } = await supabase
            .from("timer_end")
            .select("form_2h")
            .eq("pdf_id", id)
            .maybeSingle();
            
          if (data && !data.form_2h) {
            await supabase
              .from("timer_end")
              .update({ form_2h: "non-fait" })
              .eq("pdf_id", id);
              
            setShowFinalForm(false);
            navigate("/listpermisdefeu");
          }
        } catch (error) {
          console.error("Error during final form auto-submission:", error);
        }
        clearInterval(iv);
      }
    }, 1000);
    
    return () => clearInterval(iv);
  }, [showFinalForm, id, navigate, finalFormTimeoutEnd]);

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

  // Common function for form validation
  const validateForm = (date, type, equipement, intervenant, result) => {
    if (!date || !type || !equipement || !intervenant || !result) {
      alert("Veuillez remplir tous les champs.");
      return false;
    }
    return true;
  };

  // Submit verification form
  const submitVerificationForm = async (date, type, equipement, intervenant, result, formType, redirectAfter = true) => {
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
          pdf_id: id,
          timer_end_id: timerId,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        alert("Erreur lors de la soumission.");
        return false;
      }

      // Update status in timer_end table
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
      
      if (redirectAfter) {
        navigate("/listpermisdefeu");
      }
      
      return true;
    } catch (err) {
      console.error("Error in submitVerificationForm:", err);
      alert("Une erreur s'est produite.");
      return false;
    }
  };

  // Submit 15-min form
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm(firstDate, firstType, firstEquipement, firstIntervenant, firstResult)) {
      return;
    }
    
    const success = await submitVerificationForm(
      firstDate, 
      firstType, 
      firstEquipement, 
      firstIntervenant, 
      firstResult, 
      "15min",
      false // Don't redirect after this form
    );
    
    if (success) {
      console.log("Successfully submitted 15-min form");
      setShowForm(false);
      setForm15Ended(true);
      setTimerNull(true);
      
      // Clear the 20-min grace period state
      setTwentyMinStarted(false);
      setTwentyMinEnd(null);
      setTwentyMinLeft(null);
      
      // Clear the DB record for 20min timer
      try {
        await supabase
          .from("timer_end")
          .update({ "20min": null })
          .eq("pdf_id", id);
        console.log("Cleared 20min timer in DB");
      } catch (error) {
        console.error("Error clearing 20min timer:", error);
      }
    }
  };

  // Submit lunch break form
  const handleSubmitDej = async e => {
    e.preventDefault();
    
    if (!validateForm(dejDate, dejType, dejEquipement, dejIntervenant, dejResult)) {
      return;
    }
    
    const success = await submitVerificationForm(
      dejDate, 
      dejType, 
      dejEquipement, 
      dejIntervenant, 
      dejResult, 
      "dejeuner",
      false // Don't redirect after this form
    );
    
    if (success) {
      console.log("Successfully submitted lunch form");
      setShowFormDej(false);
      setTimerDejStarted(false);
      setLunchDisabled(true);
      
      // Clear the lunch form timeout state
      setLunchFormTimeoutEnd(null);
      setLunchFormTimeLeft(null);
      
      // Clear the DB record for 20minfordej timer
      try {
        await supabase
          .from("timer_end")
          .update({ "20minfordej": null })
          .eq("pdf_id", id);
        console.log("Cleared 20minfordej timer in DB");
      } catch (error) {
        console.error("Error clearing 20minfordej timer:", error);
      }
    }
  };

  // Submit 2h form
  const handleFinalForm = async e => {
    e.preventDefault();
    
    if (!validateForm(finalDate, finalType, finalEquipement, finalIntervenant, finalResult)) {
      return;
    }
    
    const success = await submitVerificationForm(
      finalDate, 
      finalType, 
      finalEquipement, 
      finalIntervenant, 
      finalResult, 
      "2h",
      true // Redirect after this form (it's the final form)
    );
    
    if (success) {
      console.log("Successfully submitted final form");
      
      // Clear all timers and states
      setShowFinalForm(false);
      setTimer2hStarted(false);
      setEndTime2h(null);
      setRemainingTime2h(null);
      setFinalFormTimeoutEnd(null);
      setFinalFormTimeLeft(null);
      
      // Clear the DB record for 20minfor2h timer
      try {
        await supabase
          .from("timer_end")
          .update({ "20minfor2h": null })
          .eq("pdf_id", id);
        console.log("Cleared 20minfor2h timer in DB");
      } catch (error) {
        console.error("Error clearing 20minfor2h timer:", error);
      }
      
      // The redirect happens in submitVerificationForm
    }
  };

  // Generic Form Component - reused for all forms
  const FormComponent = ({ 
    title, 
    date, setDate, 
    type, setType, 
    equipement, setEquipement,
    intervenant, setIntervenant,
    result, setResult,
    onSubmit,
    timeLeft
  }) => (
    <>
      {timeLeft > 0 && (
        <div className="mb-2 text-red-500 font-semibold">
          Temps restant: {Math.floor(timeLeft / 60000).toString().padStart(2, "0")}:{Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, "0")}
        </div>
      )}
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

        {/* Type */}
        <select 
          value={type} 
          onChange={e => setType(e.target.value)} 
          className="border p-2 rounded" 
          required
        >
          <option value="">Sélectionnez le type</option>
          <option value="15min">15 min</option>
          <option value="dejeuner 15min">Déjeuner 15 min</option>
          <option value="2h">2 h</option>
        </select>

        {/* Equipement */}
        <select 
          value={equipement} 
          onChange={e => setEquipement(e.target.value)} 
          className="border p-2 rounded" 
          required
        >
          <option value="">Sélectionnez l'équipement</option>
          {equipements.map(zone => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>

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

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Soumettre le Rapport
        </button>
      </form>
    </>
  );

  // Improved renderContent function to ensure clear state transitions
  const renderContent = () => {
    if (loading) {
      return <div className="text-gray-500">Chargement…</div>;
    }

    // Priority order for display:
    // 1. Final form (if it's time for that)
    // 2. Lunch form (if it's showing)
    // 3. 15-min form (if it's showing)
    // 4. Timer displays based on state

    // Final form has highest priority
    if (showFinalForm) {
      return (
        <FormComponent 
          title="Rapport de Fin"
          date={finalDate} setDate={setFinalDate}
          type={finalType} setType={setFinalType}
          equipement={finalEquipement} setEquipement={setFinalEquipement}
          intervenant={finalIntervenant} setIntervenant={setFinalIntervenant}
          result={finalResult} setResult={setFinalResult}
          onSubmit={handleFinalForm}
          timeLeft={finalFormTimeLeft}
        />
      );
    }
    
    // Then lunch form
    if (showFormDej) {
      return (
        <FormComponent 
          title="Rapport du Pause"
          date={dejDate} setDate={setDejDate}
          type={dejType} setType={setDejType}
          equipement={dejEquipement} setEquipement={setDejEquipement}
          intervenant={dejIntervenant} setIntervenant={setDejIntervenant}
          result={dejResult} setResult={setDejResult}
          onSubmit={handleSubmitDej}
          timeLeft={lunchFormTimeLeft}
        />
      );
    }
    
    // Then 15-min form
    if (timerFinished && showForm && !form15Ended) {
      return (
        <FormComponent 
          title="Rapport du verification 15min"
          date={firstDate} setDate={setFirstDate}
          type={firstType} setType={setFirstType}
          equipement={firstEquipement} setEquipement={setFirstEquipement}
          intervenant={firstIntervenant} setIntervenant={setFirstIntervenant}
          result={firstResult} setResult={setFirstResult}
          onSubmit={handleSubmit}
          timeLeft={twentyMinLeft}
        />
      );
    }
    
    // Now timer displays based on state
    
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
    
    // Failsafe - should never reach here
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