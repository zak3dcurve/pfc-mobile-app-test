import React, { useState, useEffect, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useNavigate } from "react-router-dom";
import SignaturePad from "signature_pad";
import { useAuth } from "@/features/auth/utils/auth-context";

const AddPermisFeu = () => {
  // --------------------------
  // Refs for Signature Canvases
  // --------------------------
  const sigSurveillanceRef = useRef(null);
  const sigSiteRef = useRef(null);

  // --------------------------
  // State: Dropdown Options
  // --------------------------
  const [personOptions, setPersonOptions] = useState([]);
  const [entrepriseOptions, setEntrepriseOptions] = useState([]);
  const [lieuOptions, setLieuOptions] = useState([]);

  // Checkbox options (these could be static or stored in tables)
  const [sourceChaleurOptions, setSourceChaleurOptions] = useState([]);
  const [facteursAggravantsOptions, setFacteursAggravantsOptions] = useState([]);
  const [mesuresAvOptions, setMesuresAvOptions] = useState([]);
  const [mesuresPnOptions, setMesuresPnOptions] = useState([]);

  // --------------------------
  // State: Form Data
  // --------------------------
  // Datetime fields
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [dejeunerDebut, setDejeunerDebut] = useState("");
  const [dejeunerFin, setDejeunerFin] = useState("");

  // Radio button for entreprise choice ("EE" or "EU")
  const [choixEntreprise, setChoixEntreprise] = useState("");

  // CreatableSelect fields for persons, entreprises, lieux
  const [selectedSurveillance, setSelectedSurveillance] = useState(null); // resp_surveillance_id
  const [selectedTravauxPerson, setSelectedTravauxPerson] = useState(null); // for intervenant if needed
  const [selectedSiteResponsable, setSelectedSiteResponsable] = useState(null); // resp_site_id
  const [selectedEntrepriseSite, setSelectedEntrepriseSite] = useState(null); // entreprise_resp_site_id
  const [selectedLieu, setSelectedLieu] = useState(null); // lieu_id

  // Signatures
  const [respSurvSignature, setRespSurvSignature] = useState("");
  const [respSiteSignature, setRespSiteSignature] = useState("");

  // Text field for operation description
  const [operationDescription, setOperationDescription] = useState("");

  // Multi-checkbox selections (for junction tables)
  const [sourceChaleur, setSourceChaleur] = useState([]);
  const [facteursAggravants, setFacteursAggravants] = useState([]);
  const [mesuresPreventionAv, setMesuresPreventionAv] = useState([]);
  const [mesuresPreventionPn, setMesuresPreventionPn] = useState([]);



const navigate = useNavigate();
// Redirect to the permis de feu list page after successful submission


  // New state for measure selections (AVANT and PENDANT)
const [mesuresPreventionAvSelections, setMesuresPreventionAvSelections] = useState({});
const [mesuresPreventionPnSelections, setMesuresPreventionPnSelections] = useState({});



const { entreprise: entrepriseUtilisatrice } = useAuth();

const handleSurveillanceChange = async (option) => {
  if (option && option.__isNew__) {
    // Insert the new person with entreprise_utilisatrice from useAuth
    const { data, error } = await supabase
      .from("persons")
      .insert({ name: option.label, entreprise_id: entrepriseUtilisatrice.id })
      .select()
      .maybeSingle();
    if (!error && data) {
      const newOption = { value: data.id, label: data.name };
      setSelectedSurveillance(newOption);
      // Optionally add the new person to the options list:
      setPersonOptions((prev) => [...prev, newOption]);
    } else {
      console.error("Error inserting new responsable:", error);
    }
  } else {
    setSelectedSurveillance(option);
  }
};

useEffect(() => {
  if (entrepriseOptions.length > 0 && !selectedEntrepriseSite) {
    setSelectedEntrepriseSite(entrepriseOptions[0]);
  }
}, [entrepriseOptions, selectedEntrepriseSite]);

const handleSiteResponsableChange = async (option) => {
  if (option && option.__isNew__) {
    if (!selectedEntrepriseSite) {
      alert("Veuillez d'abord sélectionner une entreprise.");
      return;
    }
    // Insert the new person with the selected entreprise's id
    const { data, error } = await supabase
      .from("persons")
      .insert({ name: option.label, entreprise_id: selectedEntrepriseSite.value })
      .select()
      .maybeSingle();
    if (!error && data) {
      const newOption = { value: data.id, label: data.name };
      setSelectedSiteResponsable(newOption);
      // Optionally update personOptions:
      setPersonOptions((prev) => [...prev, newOption]);
    } else {
      console.error("Error inserting new site responsable:", error);
    }
  } else {
    setSelectedSiteResponsable(option);
  }
};

const filteredPersonOptionsForSurveillance = personOptions.filter(
  (p) => p.entreprise_id === entrepriseUtilisatrice.id
);

const handleEntrepriseChange = async (option) => {
  if (option && option.__isNew__) {
    // Insert new entreprise into Supabase
    const { data, error } = await supabase
      .from("entreprises")
      .insert({ name: option.label })
      .select()
      .maybeSingle();
    if (!error && data) {
      const newOption = { value: data.id, label: data.name };
      setSelectedEntrepriseSite(newOption);
      setEntrepriseOptions((prev) => [...prev, newOption]);
    } else {
      console.error("Erreur lors de l'insertion de la nouvelle entreprise :", error);
    }
  } else {
    setSelectedEntrepriseSite(option);
  }
};


const handleZoneChange = async (option) => {
  if (option && option.__isNew__) {
    // Insert new zone into Supabase (table: zones)
    const { data, error } = await supabase
      .from("zones")
      .insert({ name: option.label })
      .select()
      .maybeSingle();
    if (!error && data) {
      const newOption = { value: data.id, label: data.name };
      setSelectedLieu(newOption);
      setLieuOptions((prev) => [...prev, newOption]);
    } else {
      console.error("Erreur lors de l'insertion de la nouvelle zone :", error);
    }
  } else {
    setSelectedLieu(option);
  }
};


































// For the responsable (surveillance) signature
const sigPadSurveillance = useRef(null);
const signaturePadSurveillance = useRef(null);

// For the site signature
const sigPadSite = useRef(null);
const signaturePadSite = useRef(null);

useEffect(() => {
  if (sigPadSurveillance.current) {
    const canvas = sigPadSurveillance.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePadSurveillance.current = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: "black",
    });
  }
  if (sigPadSite.current) {
    const canvas = sigPadSite.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePadSite.current = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: "black",
    });
  }
}, []); // Run once on mount



const clearSignatureSurveillance = () => {
  if (signaturePadSurveillance.current) {
    signaturePadSurveillance.current.clear();
  }
};

const clearSignatureSite = () => {
  if (signaturePadSite.current) {
    signaturePadSite.current.clear();
  }
};


















// Helper function to toggle measure selection for a given measure and type
const toggleMeasureSelection = (measureId, type, currentSelections, setSelections) => {
  setSelections((prev) => {
    const current = prev[measureId] || { EE: false, EU: false };
    return {
      ...prev,
      [measureId]: {
        ...current,
        [type]: !current[type],
      },
    };
  });
};



  // --------------------------
  // useEffect: Fetch Options from Supabase
  // --------------------------
  useEffect(() => {
    const fetchOptions = async () => {
      // Fetch persons
      const { data: personsData, error: personsError } = await supabase
        .from("persons")
        .select("*");
      if (!personsError && personsData) {
        setPersonOptions(
  personsData.map((p) => ({
    value: p.id,
    label: p.name,
    entreprise_id: p.entreprise_id, // now available for filtering
  }))
);
      }

      // Fetch entreprises
      const { data: entreprisesData, error: entreprisesError } = await supabase
        .from("entreprises")
        .select("*");
      if (!entreprisesError && entreprisesData) {
        setEntrepriseOptions(
          entreprisesData.map((e) => ({ value: e.id, label: e.name }))
        );
      }

      // Fetch lieux
      const { data: lieuxData, error: lieuxError } = await supabase
        .from("zones")
        .select("*");
      if (!lieuxError && lieuxData) {
        console.log("Fetched options:", lieuxData)

        setLieuOptions(
          lieuxData.map((l) => ({ value: l.id, label: l.name }))
        );
        
      }
else {
          console.error("Error fetching lieux:", lieuxError);
        }

      // Fetch checkbox options – these tables (or static values) must exist in your DB
      const { data: schData } = await supabase
        .from("sources_chaleur")
        .select("*");
      if (schData){

        console.log("Fetched options:", schData)
        setSourceChaleurOptions(
          schData.map((item) => ({ value: item.id, label: item.name }))
        );
            }
      else {
        console.error("Error fetching source de chaleur:", schData);
      }

      const { data: fagData } = await supabase
        .from("facteurs_aggravants")
        .select("*");
      if (fagData) setFacteursAggravantsOptions(
        fagData.map((item) => ({ value: item.id, label: item.name }))
      );

      const { data: avData } = await supabase
        .from("mesure_prev_av")
        .select("*");
      if (avData) setMesuresAvOptions(
        avData.map((item) => ({ value: item.id, label: item.name }))
      );


      const { data: pnData } = await supabase
        .from("mesure_prev_pn")
        .select("*");
      if (pnData) setMesuresPnOptions(
        pnData.map((item) => ({ value: item.id, label: item.name }))
      );
    };

    fetchOptions();
  }, []);

  // --------------------------
  // Checkbox Helper Function
  // --------------------------
  const toggleCheckbox = (value, currentArray, setArray) => {
    if (currentArray.includes(value)) {
      setArray(currentArray.filter((item) => item !== value));
    } else {
      setArray([...currentArray, value]);
    }
  };

  // --------------------------
  // Signature Functions
  // --------------------------
  const captureSurveillanceSignature = () => {
    if (sigSurveillanceRef.current) {
      const data = sigSurveillanceRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      setRespSurvSignature(data);
    }
  };

  const clearSurveillanceSignature = () => {
    sigSurveillanceRef.current.clear();
    setRespSurvSignature("");
  };

  const captureSiteSignature = () => {
    if (sigSiteRef.current) {
      const data = sigSiteRef.current.getTrimmedCanvas().toDataURL("image/png");
      setRespSiteSignature(data);
    }
  };

  const clearSiteSignature = () => {
    sigSiteRef.current.clear();
    setRespSiteSignature("");
  };

  // --------------------------
  // Handle Form Submit (Using Supabase)
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Capture signatures (if not already captured)
    captureSurveillanceSignature();
    captureSiteSignature();

    // Build payload for the main permisdefeu record.
    const payload = {
      heure_debut: heureDebut ? appendTimezoneOffset(heureDebut) : null,
      heure_fin: heureFin ? appendTimezoneOffset(heureFin) : null,
      dejeuner_debut: dejeunerDebut ? appendTimezoneOffset(dejeunerDebut) : null,
      dejeuner_fin: dejeunerFin ? appendTimezoneOffset(dejeunerFin) : null,
      choix_entreprise: choixEntreprise, // This will be either "EE" or "EU"
      resp_surveillance_id: selectedSurveillance?.value || null,
      resp_surv_signature: respSurvSignature,
      resp_site_id: selectedSiteResponsable?.value || null,
      resp_site_signature: respSiteSignature,
      entreprise_resp_site_id: selectedEntrepriseSite?.value || null,
      lieu_id: selectedLieu?.value || null,
      operation_description: operationDescription,
    };

    // Insert into permisdefeu table
    const { data: permisData, error: permisError } = await supabase
      .from("permis_de_feu")
      .insert(payload)
      .select()
      .single();

    if (permisError) {
      console.error("Error inserting permisdefeu:", permisError);
      alert("Error inserting permisdefeu");
      return;
    }

    const permisId = permisData.id;

    // Insert multi-select options into their respective junction tables.
    // For source de chaleur:
    if (sourceChaleur.length > 0) {
      const rows = sourceChaleur.map((item) => ({
        pdf_id: permisId,
        sch_id: item,
      }));
      const { error } = await supabase
        .from("pdf_sch_junction")
        .insert(rows);
      if (error) console.error("Error inserting source_chaleur:", error);
    }

    // For facteurs aggravants:
    if (facteursAggravants.length > 0) {
      const rows = facteursAggravants.map((item) => ({
        pdf_id: permisId,
        faggravant_id: item,
      }));
      const { error } = await supabase
        .from("pdf_faggravant_junction")
        .insert(rows);
      if (error) console.error("Error inserting facteurs_aggravants:", error);
    }

// For Mesures de Prévention AVANT:
const avRows = [];
for (const measureId in mesuresPreventionAvSelections) {
  const sel = mesuresPreventionAvSelections[measureId];
  if (sel.EE || sel.EU) {
    let entrepriseValue;
    if (sel.EE && sel.EU) entrepriseValue = "BOTH";
    else if (sel.EE) entrepriseValue = "E.E";
    else if (sel.EU) entrepriseValue = "E.U";
    avRows.push({
      pdf: permisId,
      mpa: measureId,
      entreprise: entrepriseValue,
    });
  }
}
if (avRows.length > 0) {
  const { error } = await supabase.from("pdf_mpa_junction").insert(avRows);
  if (error) console.error("Error inserting mesures_prevention_av:", error);
}

// For Mesures de Prévention PENDANT:
const pnRows = [];
for (const measureId in mesuresPreventionPnSelections) {
  const sel = mesuresPreventionPnSelections[measureId];
  if (sel.EE || sel.EU) {
    let entrepriseValue;
    if (sel.EE && sel.EU) entrepriseValue = "BOTH";
    else if (sel.EE) entrepriseValue = "E.E";
    else if (sel.EU) entrepriseValue = "E.U";
    pnRows.push({
      pdf: permisId,
      mpp: measureId,
      entreprise: entrepriseValue,
    });
  }
}
if (pnRows.length > 0) {
  const { error } = await supabase.from("pdf_mpp_junction").insert(pnRows);
  if (error) console.error("Error inserting mesures_prevention_pn:", error);
}

    alert("Permis de Feu enregistré avec succès !");
    navigate("/listpermisdefeu"); // Redirect to the list page
    // Optionally reset form fields here
  };







// Preselect first three "Mesures de Prévention - AVANT LE TRAVAIL"
useEffect(() => {
  if (mesuresAvOptions.length > 0) {
    const defaultAvSelections = { ...mesuresPreventionAvSelections };
    mesuresAvOptions.forEach((opt, index) => {
      // Preselect if index is 0,1,2 (first three) OR index === 4 (fifth item)
      if (index < 3 || index === 4 || index === 8) {
        defaultAvSelections[opt.value] = { EU: true };
      }
    });
    setMesuresPreventionAvSelections(defaultAvSelections);
  }
}, [mesuresAvOptions]);

// Preselect first three "Mesures de Prévention - PENDANT LE TRAVAIL"
useEffect(() => {
  if (mesuresPnOptions.length > 0) {
    const defaultPnSelections = { ...mesuresPreventionPnSelections };
    mesuresPnOptions.slice(0, 3).forEach((opt) => {
      defaultPnSelections[opt.value] = {  EU: true }; // or adjust defaults as needed
    });
    setMesuresPreventionPnSelections(defaultPnSelections);
  }
}, [mesuresPnOptions]);









const appendTimezoneOffset = (localDateTimeString) => {
  if (!localDateTimeString || localDateTimeString.trim() === "") return null;
  const localDate = new Date(localDateTimeString);
  if (isNaN(localDate.getTime())) return null;
  const offsetMinutes = -localDate.getTimezoneOffset();
  const pad = (n) => String(n).padStart(2, "0");
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetRemMinutes = pad(Math.abs(offsetMinutes) % 60);
  return `${localDateTimeString}${sign}${offsetHours}:${offsetRemMinutes}`;
};











  // --------------------------
  // Render the Form
  // --------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-4 overflow-auto pt-20">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">Permis de Feu</h1>

        {/* Horaires */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Horaires</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date et Heure de début</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date et Heure de fin</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Début pause déjeuner</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                value={dejeunerDebut}
                onChange={(e) => setDejeunerDebut(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fin pause déjeuner</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                value={dejeunerFin}
                onChange={(e) => setDejeunerFin(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Responsable de la surveillance */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsable de la surveillance</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Choix (E.E / E.U)</label>
            <div className="mt-1">
              <label className="mr-4 inline-flex items-center">
                <input
                  type="radio"
                  name="surveillance_choice"
                  className="form-radio"
                  value="EE"
                  checked={choixEntreprise === "EE"}
                  onChange={(e) => setChoixEntreprise(e.target.value)}
                />
                <span className="ml-2">E.E</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="surveillance_choice"
                  className="form-radio"
                  value="EU"
                  checked={choixEntreprise === "EU"}
                  onChange={(e) => setChoixEntreprise(e.target.value)}
                />
                <span className="ml-2">E.U</span>
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Nom du responsable</label>
            <CreatableSelect
  options={filteredPersonOptionsForSurveillance}
  value={selectedSurveillance}
  onChange={handleSurveillanceChange}
  placeholder="Sélectionnez ou créez un responsable"
/>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Signature du responsable</label>
            <div className="mt-1 border border-gray-300 rounded mx-auto" style={{ width: "500px", height: "150px" }}>
  <canvas ref={sigPadSurveillance} className="w-full h-full" />
</div>
<button
  type="button"
  onClick={clearSignatureSurveillance}
  className="mt-2 text-blue-600 text-sm"
>
  Effacer la signature
</button>
            
          </div>
        </section>

        {/* Travaux réalisés par */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Travaux réalisés par</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Nom de la personne</label>
            <CreatableSelect
  options={personOptions}
  value={selectedSiteResponsable}
  onChange={handleSiteResponsableChange}
  placeholder="Sélectionnez ou créez un responsable"
/>

          </div>
        </section>

        {/* Responsable du site / délégation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsable du site / délégation</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Entreprise (site)</label>
            <CreatableSelect
  options={entrepriseOptions}
  value={selectedEntrepriseSite}
  onChange={handleEntrepriseChange}
  placeholder="Sélectionnez ou créez une entreprise"
/>

          </div>
          <div className="mb-4">
            
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <div className="mt-1 border border-gray-300 rounded mx-auto" style={{ width: "500px", height: "150px" }}>
  <canvas ref={sigPadSite} className="w-full h-full" />
</div>
<button
  type="button"
  onClick={clearSignatureSite}
  className="mt-2 text-blue-600 text-sm"
>
  Effacer la signature
</button>

            
          </div>
        </section>

        {/* Lieu et Opération */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Localisation & Opération</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Localisation / Lieu</label>
            <CreatableSelect
  options={lieuOptions}
  value={selectedLieu}
  onChange={handleZoneChange}
  placeholder="Sélectionnez ou créez une zone..."
/>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Opération à effectuer</label>
            <textarea
              rows="3"
              placeholder="Description de l'opération"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              value={operationDescription}
              onChange={(e) => setOperationDescription(e.target.value)}
            />
          </div>
        </section>

        {/* Source de Chaleur */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Source de Chaleur</h2>
          <div className="grid grid-cols-3 gap-4">
          {sourceChaleurOptions.map((opt) => (
  <label key={opt.value} className="flex items-center">
    <input
      type="checkbox"
      className="form-checkbox"
      checked={sourceChaleur.includes(opt.value)}
      onChange={() => toggleCheckbox(opt.value, sourceChaleur, setSourceChaleur)}
    />
    <span className="ml-2">{opt.label}</span>
  </label>
))}
          </div>
        </section>

        {/* Facteurs Aggravants */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Facteurs Aggravants</h2>
          <div className="grid grid-cols-3 gap-4">
            {facteursAggravantsOptions.map((opt) => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={facteursAggravants.includes(opt.value)}
                  onChange={() => toggleCheckbox(opt.value, facteursAggravants, setFacteursAggravants)}
                />
                <span className="ml-2">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

       {/* Mesures de Prévention - AVANT LE TRAVAIL */}
<section className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Mesures de Prévention - AVANT LE TRAVAIL</h2>
  <div className="grid grid-cols-1 gap-4">
    {mesuresAvOptions.map((opt) => (
      <div key={opt.value}>
        <div>{opt.label}</div>
        <div className="flex gap-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={mesuresPreventionAvSelections[opt.value]?.EE || false}
              onChange={() =>
                toggleMeasureSelection(
                  opt.value,
                  "EE",
                  mesuresPreventionAvSelections,
                  setMesuresPreventionAvSelections
                )
              }
            />
            <span className="ml-1">E.E</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={mesuresPreventionAvSelections[opt.value]?.EU || false}
              onChange={() =>
                toggleMeasureSelection(
                  opt.value,
                  "EU",
                  mesuresPreventionAvSelections,
                  setMesuresPreventionAvSelections
                )
              }
            />
            <span className="ml-1">E.U</span>
          </label>
        </div>
      </div>
    ))}
  </div>
</section>

        {/* Mesures de Prévention - PENDANT LE TRAVAIL */}
<section className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Mesures de Prévention - PENDANT LE TRAVAIL</h2>
  <div className="grid grid-cols-1 gap-4">
    {mesuresPnOptions.map((opt) => (
      <div key={opt.value}>
        <div>{opt.label}</div>
        <div className="flex gap-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={mesuresPreventionPnSelections[opt.value]?.EE || false}
              onChange={() =>
                toggleMeasureSelection(
                  opt.value,
                  "EE",
                  mesuresPreventionPnSelections,
                  setMesuresPreventionPnSelections
                )
              }
            />
            <span className="ml-1">E.E</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={mesuresPreventionPnSelections[opt.value]?.EU || false}
              onChange={() =>
                toggleMeasureSelection(
                  opt.value,
                  "EU",
                  mesuresPreventionPnSelections,
                  setMesuresPreventionPnSelections
                )
              }
            />
            <span className="ml-1">E.U</span>
          </label>
        </div>
      </div>
    ))}
  </div>
</section>

        {/* Submit Button */}
        <div className="text-center">
          <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-md font-semibold">
            Valider le Permis de Feu
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPermisFeu;
