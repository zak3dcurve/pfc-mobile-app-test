import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useAuth } from "@/features/auth/utils/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { PhotoUploader } from "../components/PhotoUploader";
import { Capacitor } from '@capacitor/core';
import TopdonThermal from '../plugins/topdon-thermal';


  const FormComponent = ({

    title,

    date, setDate,

    intervenant, setIntervenant,

    result, setResult,

      motif, setMotif,  // ✅ Add these

  equipements,    // ✅ Add this

  intervenants,   // ✅ Add this

    onSubmit,

        photos, setPhotos, // ✅ ADD THESE PROPS



    formType,
thermalImage,
onCaptureThermal,

  }) => (

    <form onSubmit={onSubmit} className="flex flex-col gap-3">

      <h2 className="font-semibold text-xl">{title}</h2>



      {/* Date */}

      <input

        type="datetime-local"

        value={date}

        onChange={e => setDate(e.target.value)}

        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[44px] sm:min-h-[40px]" style={{ fontSize: '16px' }}

        required

      />



      {/* Equipement */}

      <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-gray-50 min-h-[44px] sm:min-h-[40px] flex items-center">

      <strong>Équipement: </strong>

      {equipements.length > 0 ? equipements[0].name : "Chargement..."}

    </div>



      {/* Intervenant */}

      <select

        value={intervenant}

        onChange={e => setIntervenant(e.target.value)}

        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[44px] sm:min-h-[40px]" style={{ fontSize: '16px' }}

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

        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[44px] sm:min-h-[40px]" style={{ fontSize: '16px' }}

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

        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px] resize-vertical" style={{ fontSize: '16px' }}

        required

      />

    )}



{/* ✅ ADD THE PHOTO UPLOADER COMPONENT HERE */}

      {/* On web: show only file chooser. On mobile: show full PhotoUploader */}
      {Capacitor.getPlatform() === 'web' ? (
        <div className="border p-2 rounded bg-gray-50 my-3">
          <strong className="block mb-2">Photos de vérification:</strong>
          <div className="flex gap-2">
            <label className="flex-1 bg-blue-500 text-white text-center p-2 rounded cursor-pointer hover:bg-blue-600">
              <span>Choisir Fichiers</span>
              <input type="file" multiple accept="image/*" onChange={(e) => {
                if (e.target.files) {
                  const fileArray = Array.from(e.target.files).map(file => ({
                    file: file,
                    preview: URL.createObjectURL(file)
                  }));
                  setPhotos(prevPhotos => [...prevPhotos, ...fileArray]);
                }
              }} className="hidden" />
            </label>
          </div>
          {/* Previews */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img src={photo.preview} alt="preview" className="w-full h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <PhotoUploader photos={photos} setPhotos={setPhotos} />
      )}

      {/* Topdon Thermal Camera Button - Only on mobile */}
{Capacitor.getPlatform() !== 'web' && (
<div className="flex flex-col gap-2">
  <button
    type="button"
    onClick={onCaptureThermal}
    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[44px]"
  >
    🌡️ Capturer Image Thermique
  </button>
  
  {thermalImage && (
    <div className="border-2 border-purple-300 rounded-md p-2">
      <p className="text-sm text-gray-600 mb-2">Aperçu thermique:</p>
      <img 
        src={thermalImage} 
        alt="Thermal preview"
        className="w-full h-48 object-contain bg-black rounded"
      />
    </div>
  )}
</div>
)}

      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]">

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

const [thermalImage, setThermalImage] = useState('');
const [cameraReady, setCameraReady] = useState(false);
const [cameraError, setCameraError] = useState('');

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

  const [firstPhotos, setFirstPhotos] = useState([]); // ✅ ADD THIS

  const [dejPhotos, setDejPhotos] = useState([]);     // ✅ ADD THIS

  const [finalPhotos, setFinalPhotos] = useState([]);  // ✅ ADD THIS



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


useEffect(() => {
  if (Capacitor.getPlatform() !== 'android') {
    console.log('TopdonThermal: skipping ping, not on Android');
    return;
  }

  const testPlugin = async () => {
    try {
      const res = await TopdonThermal.ping();
      console.log('TopdonThermal ping OK:', res);
    } catch (err) {
      console.error('TopdonThermal ping ERROR:', err);
      alert('TopdonThermal ping ERROR: ' + err.message);
    }
  };

  testPlugin();
}, []);
























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




//new















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


// 👇 add this helper function somewhere above handleCaptureThermal
const waitForCameraReady = async (timeoutMs = 4000) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const { ready } = await TopdonThermal.isReady();
      console.log('TopdonThermal isReady() ->', ready);
      if (ready) return true;
    } catch (e) {
      console.warn('isReady() error:', e);
    }

    // wait a bit before checking again
    await new Promise(res => setTimeout(res, 300));
  }

  return false;
};


//new

const handleCaptureThermal = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    alert('🖥️ La caméra thermique ne fonctionne que dans l’app Android.');
    return;
  }

  try {
    // 1) initialize (register USB monitor + ask permission)
    await TopdonThermal.initialize();

    // 2) give Android some time to actually open the camera
    const ready = await waitForCameraReady();

    if (!ready) {
      alert('⚠️ Caméra non prête.\n\n- Vérifiez que le Topdon TC001 est bien branché.\n- Si une fenêtre de permission s’ouvre, acceptez-la puis réessayez.');
      return;
    }

    // 3) NOW it should be connected → capture
    const result = await TopdonThermal.captureImage();
    setThermalImage(`data:image/png;base64,${result.image}`);
    alert(`✅ Capturé! Temp: ${result.centerTemperature}°C`);
  } catch (error) {
    console.error('TopdonThermal capture error', error);
    alert('❌ Erreur caméra thermique: ' + error.message);
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



// ✅ REPLACE the entire old submitVerificationForm function with this new one

const submitVerificationForm = async (date, type, equipement, intervenant, result, motif, photos, formType, redirectAfter = true) => {

    setLoading(true);

    try {

      // Step 1: Insert form data and get the new row's ID

      const { data: verificationData, error: insertError } = await supabase

        .from("verification_form")

        .insert({

          date, type, equipement, intervenant, result,

          motif: result === "Anomalie" ? motif : null,

          pdf_id: id,

          timer_end_id: timerId,

        })

        .select('id')

        .single();



      if (insertError) throw insertError;

      const newVerificationId = verificationData.id;



      // Step 2: Loop through photos, upload each one, and link it

      if (photos && photos.length > 0) {

        for (const photo of photos) {

          const file = photo.file;

          // Create a unique path for each photo to avoid overwriting files

          const fileName = `${newVerificationId}/${Date.now()}_${file.name}`;

         

          const { error: uploadError } = await supabase.storage

            .from('verification-images') // Make sure this is your bucket name

            .upload(fileName, file);

           

          if (uploadError) throw uploadError;



          // Get the public URL of the file we just uploaded

          const { data: { publicUrl } } = supabase.storage

            .from('verification-images')

            .getPublicUrl(fileName);



          // Insert the photo's URL and its link to the verification form

          const { error: photoInsertError } = await supabase

            .from('verification_photos') // The new table for photo URLs

            .insert({

              photo_url: publicUrl,

              verification_id: newVerificationId

            });



          if (photoInsertError) throw photoInsertError;




        }

      }
if (thermalImage) {
  const response = await fetch(thermalImage);
  const blob = await response.blob();
  const thermalFileName = `${newVerificationId}/thermal_${Date.now()}.png`;
  
  await supabase.storage.from('verification-images').upload(thermalFileName, blob);
  const { data: { publicUrl } } = supabase.storage.from('verification-images').getPublicUrl(thermalFileName);
  
  await supabase.from('verification_photos').insert({
    photo_url: publicUrl,
    verification_id: newVerificationId,
    is_thermal: true
  });
  
  setThermalImage('');
}


      // Step 3: The rest of your existing logic for anomaly/RAS

      if (result === "Anomalie") {

        if (formType === "15min") { await restart15MinTimer(); await restart2HTimer(); }

        else if (formType === "dejeuner") { await restartLunchTimer(); }

        else if (formType === "2h") { await restart15MinTimer(); await restart2HTimer(); }

      } else if (result === "RAS") {

        const updateField = formType === "15min" ? "form_15min" : formType === "dejeuner" ? "form_15min_dejeuner" : "form_2h";

        await supabase.from("timer_end").update({ [updateField]: "done" }).eq("pdf_id", id);

        if (formType === "2h") {

          await supabase.from("permis_de_feu").update({ status: "archived" }).eq("id", id);

          if (redirectAfter) navigate("/listpermisdefeu");

        }

      }

      return true;



    } catch (err) {

      console.error("Error in submitVerificationForm:", err);

      alert(`Une erreur s'est produite: ${err.message}`);

      return false;

    } finally {

      setLoading(false);

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

        firstMotif,  // Add this

  firstPhotos, // ✅ ADD THIS ARGUMENT



      "15min",

      false

    );

   

    if (success) {

      console.log("Successfully submitted 15-min form");

        setFirstPhotos([]); // ✅ ADD THIS LINE to clear photos



      if (firstResult === "RAS") {

        setShowForm(false);

        setForm15Ended(true);

        setTimerNull(true);

          setFirstMotif("");  // Add this



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

        dejMotif,  // Add this

  dejPhotos, // ✅ ADD THIS ARGUMENT



      "dejeuner",

      false

    );

   

    if (success) {

      console.log("Successfully submitted lunch form");

        setDejPhotos([]); // ✅ ADD THIS LINE to clear photos



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

        setDejMotif("");  // Add this



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

        finalMotif,  // Add this

  finalPhotos, // ✅ ADD THIS ARGUMENT



      "2h",

      finalResult === "RAS" // Only redirect if RAS

    );

   

    if (success) {

      console.log("Successfully submitted final form");

        setFinalPhotos([]); // ✅ ADD THIS LINE to clear photos



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

        setFinalMotif("");  // Add this



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

            motif={finalMotif} setMotif={setFinalMotif}  // Add this

  equipements={equipements}      // ✅ Add this

  intervenants={intervenants}    // ✅ Add this

        photos={finalPhotos} setPhotos={setFinalPhotos} // ✅ ADD THESE PROPS



          onSubmit={handleFinalForm}

          formType="2h"

thermalImage={thermalImage}
onCaptureThermal={handleCaptureThermal}
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

            motif={dejMotif} setMotif={setDejMotif}  // Add this

  equipements={equipements}      // ✅ Add this

  intervenants={intervenants}    // ✅ Add this

        photos={dejPhotos} setPhotos={setDejPhotos} // ✅ ADD THESE PROPS



          onSubmit={handleSubmitDej}

          formType="dejeuner"

thermalImage={thermalImage}
onCaptureThermal={handleCaptureThermal}
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

            motif={firstMotif} setMotif={setFirstMotif}  // Add this

  equipements={equipements}      // ✅ Add this

  intervenants={intervenants}    // ✅ Add this

        photos={firstPhotos} setPhotos={setFirstPhotos} // ✅ ADD THESE PROPS



          onSubmit={handleSubmit}

          formType="15min"

thermalImage={thermalImage}
onCaptureThermal={handleCaptureThermal}

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