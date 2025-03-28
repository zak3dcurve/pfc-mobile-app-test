import { useRef, useState, useEffect } from "react";
import { z } from "zod";
import SignaturePad from "signature_pad";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { useAuth } from "@/features/auth/utils/auth-context";

// Fonction d'aide pour obtenir la date/heure locale formatée
const getFormattedLocal = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Schémas Zod pour les champs texte non modifiables (pour l'étape 1 uniquement dans ce cas)
const step1Schema = z.object({
  designation_travaux: z.string().min(1, "La désignation des travaux est requise"),
  equipements: z.string().optional(),
  cadenas_num: z.string().optional(),
  pdp: z.string().optional(),
  lockbox: z.string().optional(),
});

// Ces schémas restent vides car la validation est gérée via l'état
const step2Schema = z.object({});
const step3Schema = z.object({});

const AddConsignation = () => {
  const navigate = useNavigate();

  const { user, role, site, entreprise } = useAuth();

  // Données principales du formulaire pour les champs texte et les signatures
  const [formData, setFormData] = useState({
    date_consignation: getFormattedLocal(),
    designation_travaux: "",
    equipements: "",
    pdp: "",
    cadenas_num: "",
    lockbox: "",
    types_consignation: [],
    signature_consignateur: "",
    consigne_pour_moi: false,
    info_salle_controle: false,
    signature_demandeur: "",
    status: "pending",
    created_by: "6500088b-bace-48e4-b023-4977849c5def",
    updated_by: "6500088b-bace-48e4-b023-4977849c5def",
    signature_attestation: "",
  });

  // Tableaux d'options récupérées depuis Supabase (format { value, label })
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [consignateurs, setConsignateurs] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [types_consignations, setTypes_consignations] = useState([]);
  const [entreprisePersons, setEntreprisePersons] = useState([]);
  const [siteZones, setSiteZones] = useState([]);

  // États séparés pour les champs sélectifs créables
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedConsignateur, setSelectedConsignateur] = useState(null);
  const [selectedDemandeur, setSelectedDemandeur] = useState(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [selectedEntrepriseUtilisatrice, setSelectedEntrepriseUtilisatrice] = useState(null);
  const [selectedTypesconsignations, setSelectedTypesconsignations] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const sigPadConsignateur = useRef(null);
  const sigPadDemandeur = useRef(null);
  const sigPadAttestation = useRef(null);
  const signaturePadConsignateur = useRef(null);
  const signaturePadDemandeur = useRef(null);
  const signaturePadAttestation = useRef(null);
  


  const [showTimeDialog, setShowTimeDialog] = useState(false);
const [datetimeValue, setDatetimeValue] = useState(getFormattedLocal());


const [consigne_pour_ee, setConsignePourEE] = useState(true);
  // Récupérer les options depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: siteData } = await supabase.from("sites").select("id, name, zones(id, name)");
      const { data: zoneData } = await supabase.from("zones").select("id, name");
      const { data: consignateurData } = await supabase.from("persons").select("id, name, entreprise_id");
      const { data: demandeurData } = await supabase.from("persons").select("id, name");
      const { data: entrepriseData } = await supabase.from("entreprises").select("id, name, persons(id, name)");
      const { data: types_consignationData } = await supabase.from("types_consignation").select("id, type_name");

    
      setSites(
        (siteData || []).map((site) => ({ value: site.id, label: site.name, zones: site.zones }))
      );
      setZones(
        (zoneData || []).map((zone) => ({ value: zone.id, label: zone.name }))
      );
      setConsignateurs(
        (consignateurData || []).map((cons) => ({
          value: cons.id,
          label: cons.name,
          entreprise_id: cons.entreprise_id,
        }))
      );
      setDemandeurs(
        (demandeurData || []).map((dem) => ({ value: dem.id, label: dem.name }))
      );
      setEntreprises(
        (entrepriseData || []).map((ent) => ({
          value: ent.id,
          label: ent.name,
          persons: ent.persons,
        }))
      );
      setTypes_consignations(
        (types_consignationData || []).map((tyc) => ({ value: tyc.id, label: tyc.type_name }))
      );
    };

    fetchData();
  }, []);

  // Lorsqu'une entreprise est sélectionnée en étape 2, mettre à jour la liste des personnes pour cette entreprise
  useEffect(() => {
    if (selectedEntreprise) {
      const enterprise = entreprises.find(
        (ent) => ent.value === selectedEntreprise.value
      );
      if (enterprise && enterprise.persons) {
        setEntreprisePersons(
          enterprise.persons.map((p) => ({ value: p.id, label: p.name }))
        );
      } else {
        setEntreprisePersons([]);
      }
    } else {
      setEntreprisePersons([]);
    }
  }, [selectedEntreprise, entreprises]);

  useEffect(() => {
    if (selectedEntrepriseUtilisatrice) {
      const enterprise = entreprises.find(
        (ent) => ent.value === selectedEntrepriseUtilisatrice.value
      );
      if (enterprise && enterprise.persons) {
        setEntreprisePersons(
          enterprise.persons.map((p) => ({ value: p.id, label: p.name }))
        );
      } else {
        setEntreprisePersons([]);
      }
    } else {
      setEntreprisePersons([]);
    }
  }, [selectedEntrepriseUtilisatrice, entreprises]);

  // Pour les techniciens, auto-sélectionner l'entreprise utilisateur
  useEffect(() => {
    if (role === "technicien" && entreprise && entreprises.length > 0) {
      const matchingEntreprise = entreprises.find((e) => e.value === entreprise.id);
      if (matchingEntreprise) {
        setSelectedEntrepriseUtilisatrice(matchingEntreprise);
      }
    }
  }, [role, entreprise, entreprises]);

  // Vider le consignateur lorsque l'entreprise utilisateur change
  useEffect(() => {
    if (selectedConsignateur) {
      setSelectedConsignateur(null);
    }
  }, [selectedEntrepriseUtilisatrice]);

  // Vider le demandeur lorsque l'entreprise change
  useEffect(() => {
    if (selectedConsignateur && !formData.consigne_pour_moi) {
      setSelectedDemandeur(null);
    }
  }, [selectedEntreprise]);

  useEffect(() => {
    if (role === "technicien" && site && sites.length > 0) {
      const matchingSite = sites.find((s) => s.value === site.id);
      if (matchingSite) {
        setSelectedSite(matchingSite);
      }
    }
  }, [role, site, sites]);

  useEffect(() => {
    if (selectedSite) {
      const foundSite = sites.find((sit) => sit.value === selectedSite.value);
      if (foundSite && foundSite.zones) {
        setSiteZones(foundSite.zones.map((z) => ({ value: z.id, label: z.name })));
      } else {
        setSiteZones([]);
      }
    } else {
      setSiteZones([]);
    }
  }, [selectedSite, sites]);

  // Lorsque "consigné pour moi" est coché, définir automatiquement le demandeur comme étant le consignateur.
  useEffect(() => {
    if (formData.consigne_pour_moi && selectedConsignateur && selectedEntrepriseUtilisatrice) {
      setSelectedDemandeur(selectedConsignateur);
      setSelectedEntreprise(selectedEntrepriseUtilisatrice);
    }
  }, [formData.consigne_pour_moi, selectedConsignateur, selectedEntrepriseUtilisatrice]);

  // Initialisation de SignaturePad pour le canvas concerné
  useEffect(() => {
    if (currentStep === 2 && sigPadConsignateur.current) {
      const canvas = sigPadConsignateur.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      signaturePadConsignateur.current = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 3,
        penColor: "black",
      });
    }
    if (currentStep === 3 && sigPadDemandeur.current) {
      const canvas = sigPadDemandeur.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      signaturePadDemandeur.current = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 3,
        penColor: "black",
      });
    }
    if (currentStep === 4 && sigPadAttestation.current) {
      const canvas = sigPadAttestation.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      signaturePadAttestation.current = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 3,
        penColor: "black",
      });
    }
  }, [currentStep]);

  // Gestionnaire de changement des inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validation de l'étape actuelle
  const validateStep = (step) => {
    let newErrors = {};

    if (step === 1) {
      if (!selectedSite) newErrors.site_id = ["Le site est requis"];
      if (!selectedZone) newErrors.zone_id = ["La zone est requise"];
      if (!selectedTypesconsignations || selectedTypesconsignations.length === 0)
        newErrors.types_consignation_id = ["Le type de consignation est requis"];
      const result = step1Schema.safeParse({
        designation_travaux: formData.designation_travaux,
        equipements: formData.equipements,
        cadenas_num: formData.cadenas_num,
        pdp: formData.pdp,
        lockbox: formData.lockbox,
      });
      if (!result.success) {
        newErrors = { ...newErrors, ...result.error.flatten().fieldErrors };
      }
    } else if (step === 2) {
      if (!selectedEntrepriseUtilisatrice) newErrors.entreprise_id = ["L'entreprise est requise"];
      if (!selectedConsignateur) newErrors.consignateur_id = ["Le consignateur est requis"];
      if (!signaturePadConsignateur.current || signaturePadConsignateur.current.isEmpty()) {
        newErrors.signature_consignateur = ["La signature est requise"];
      }
      // New validation for "Informer la salle de contrôle"
  if (!formData.info_salle_controle) {
    newErrors.info_salle_controle = ["Informer la salle de contrôle est obligatoire"];
  }
    } 
    
    
    else if (step === 3) {
      // Validate selection fields only when consigne_pour_moi is false
      if (!formData.consigne_pour_moi) {
        if (!selectedDemandeur) newErrors.demandeur_id = ["Le demandeur est requis"];
        if (!selectedEntreprise) newErrors.entreprise_id = ["L'entreprise est requise"];
      }
      // Always validate the demandeur signature
      if (!signaturePadDemandeur.current || signaturePadDemandeur.current.isEmpty()) {
        newErrors.signature_demandeur = ["La signature est requise"];
      }
    }else if (step === 4) {
      
      if (!signaturePadAttestation.current || signaturePadAttestation.current.isEmpty()) {
        newErrors.signature_attestation = ["La signature est requise"];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre les étapes
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleReturn = () => {
    navigate(-1);
  };

  // Soumission finale du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!validateStep(4)) {
      return; // Prevent submission if validation fails
    }

    
    // Traitement pour le site
    let finalSite = selectedSite;
    if (selectedSite && selectedSite.__isNew__) {
      const { data, error } = await supabase
        .from("sites")
        .insert({ name: selectedSite.label })
        .select();
      if (error) console.error("Erreur lors de l'insertion du nouveau site :", error);
      else {
        finalSite = { value: Number(data[0].id), label: data[0].name };
        setSites((prev) => [...prev, finalSite]);
      }
    }

    // Traitement pour la zone
    let finalZone = selectedZone;
    if (selectedZone && selectedZone.__isNew__) {
      const { data, error } = await supabase
        .from("zones")
        .insert({ name: selectedZone.label, site_id: selectedSite ? Number(selectedSite.value) : null })
        .select();
      if (error) console.error("Erreur lors de l'insertion de la nouvelle zone :", error);
      else {
        finalZone = { value: Number(data[0].id), label: data[0].name };
        setZones((prev) => [...prev, finalZone]);
      }
    }

    // Traitement pour le consignateur
    let finalConsignateur = selectedConsignateur;
    if (selectedConsignateur && selectedConsignateur.__isNew__) {
      const newPerson = { name: selectedConsignateur.label };
      if (selectedEntrepriseUtilisatrice) {
        newPerson.entreprise_id = Number(selectedEntrepriseUtilisatrice.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (error) console.error("Erreur lors de l'insertion du nouveau consignateur :", error);
      else {
        finalConsignateur = { value: Number(data[0].id), label: data[0].name };
        setConsignateurs((prev) => [...prev, finalConsignateur]);
      }
    }

// Process for the entreprise (from step 3)
let finalEntreprise = selectedEntreprise;
if (selectedEntreprise && selectedEntreprise.__isNew__) {
  const { data, error } = await supabase
    .from("entreprises")
    .insert({ name: selectedEntreprise.label })
    .select();
  if (error) console.error("Erreur lors de l'insertion de la nouvelle entreprise :", error);
  else {
    finalEntreprise = { value: Number(data[0].id), label: data[0].name };
    setEntreprises((prev) => [...prev, finalEntreprise]);
  }
}

// Process for the demandeur (which depends on the entreprise)
let finalDemandeur = selectedDemandeur;
if (selectedDemandeur && selectedDemandeur.__isNew__) {
  const newPerson = { name: selectedDemandeur.label };
  // Use the persisted entreprise value (finalEntreprise) here
  if (finalEntreprise) {
    newPerson.entreprise_id = Number(finalEntreprise.value);
  }
  const { data, error } = await supabase.from("persons").insert(newPerson).select();
  if (error) console.error("Erreur lors de l'insertion du nouveau demandeur :", error);
  else {
    finalDemandeur = { value: Number(data[0].id), label: data[0].name };
    setDemandeurs((prev) => [...prev, finalDemandeur]);
  }
}

    let finalEntrepriseUtilisatrice = selectedEntrepriseUtilisatrice;

    // Construction du payload final.
    const updatedFormData = {
      ...formData,
      entreprise_utilisatrice_id: finalEntrepriseUtilisatrice ? Number(finalEntrepriseUtilisatrice.value) : "",
      site_id: finalSite ? Number(finalSite.value) : "",
      zone_id: finalZone ? Number(finalZone.value) : "",
      consignateur_id: finalConsignateur ? Number(finalConsignateur.value) : "",
      demandeur_id: finalDemandeur ? Number(finalDemandeur.value) : "",
      entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      signature_consignateur:
        signaturePadConsignateur.current && !signaturePadConsignateur.current.isEmpty()
          ? signaturePadConsignateur.current.toDataURL()
          : "",
      signature_demandeur:
        signaturePadDemandeur.current && !signaturePadDemandeur.current.isEmpty()
          ? signaturePadDemandeur.current.toDataURL()
          : "",
      signature_attestation:
        signaturePadAttestation.current && !signaturePadAttestation.current.isEmpty()
          ? signaturePadAttestation.current.toDataURL()
          : "",
          created_by: user.id,
    updated_by: user.id,
          
    };

    // Retirer le champ types_consignation si non utilisé
    const { types_consignation, consigne_pour_ee, ...dataToInsert } = updatedFormData;

    const { data, error } = await supabase.from("consignations").insert([dataToInsert]).select();
    if (error) {
      console.error("Erreur lors de l'insertion de la consignation :", error);
      console.error("Données tentées :", dataToInsert);
      return;
    }

    console.log("Consignation insérée avec succès !", dataToInsert);
    navigate("/consignationlist");

    if (selectedTypesconsignations && selectedTypesconsignations.length > 0) {
      const consignationId = data[0].id;
      const junctionInserts = selectedTypesconsignations.map((typeId) => ({
        cons_id: consignationId,
        typ_cons_id: typeId,
      }));

      const { data: junctionData, error: junctionError } = await supabase
        .from("consignation_types_junction")
        .insert(junctionInserts);

      if (junctionError) {
        console.error("Erreur lors de l'insertion dans la table de jonction :", junctionError);
      } else {
        console.log("Enregistrements de jonction insérés avec succès :", junctionData);
      }
    }
  };

  // Fonctions pour effacer les signatures
  const clearSignatureConsignateur = () => {
    if (signaturePadConsignateur.current) {
      signaturePadConsignateur.current.clear();
    }
  };

  const clearSignatureDemandeur = () => {
    if (signaturePadDemandeur.current) {
      signaturePadDemandeur.current.clear();
    }
  };

  const clearSignatureAttestation = () => {
    if (signaturePadAttestation.current) {
      signaturePadAttestation.current.clear();
    }
  };







  //*planified handler  *********************************************************************************************************//



  const handlePlanifiedClick = (e) => {
    e.preventDefault();
    // Minimal validation – adjust as needed:
    if (!selectedSite || !selectedZone || !selectedEntreprise) {
      // Optionally set error messages here
      return;
    }
    setShowTimeDialog(true);
  };
  const handleDatetimeConfirm = async () => {
    const newDatetime = datetimeValue; // get the selected full datetime
    // Update state (this update is async)
    setFormData((prev) => ({ ...prev, date_consignation: newDatetime }));
    setShowTimeDialog(false);
    // Instead of relying on formData, pass newDatetime directly
    await submitPlanified(newDatetime);
    navigate("/consignationplanified");
  };





















  const submitPlanified = async (newDatetime) => {
    // Validate only the minimal required fields
    let newErrors = {};
    if (!selectedSite) newErrors.site_id = ["Le site est requis"];
    if (!selectedZone) newErrors.zone_id = ["La zone est requis"];
    if (!selectedEntreprise) newErrors.entreprise_id = ["L'entreprise est requise"];
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Use the passed datetime if provided; otherwise, use formData.date_consignation
    const finalDate = newDatetime || formData.date_consignation;
    
    // Process the site
    let finalSite = selectedSite;
    if (selectedSite && selectedSite.__isNew__) {
      const { data, error } = await supabase
        .from("sites")
        .insert({ name: selectedSite.label })
        .select();
      if (error) console.error("Erreur lors de l'insertion du nouveau site :", error);
      else {
        finalSite = { value: Number(data[0].id), label: data[0].name };
        setSites((prev) => [...prev, finalSite]);
      }
    }
    
    // Process the zone
    let finalZone = selectedZone;
    if (selectedZone && selectedZone.__isNew__) {
      const { data, error } = await supabase
        .from("zones")
        .insert({ name: selectedZone.label, site_id: selectedSite ? Number(selectedSite.value) : null })
        .select();
      if (error) console.error("Erreur lors de l'insertion de la nouvelle zone :", error);
      else {
        finalZone = { value: Number(data[0].id), label: data[0].name };
        setZones((prev) => [...prev, finalZone]);
      }
    }
    
    // Process the consignateur
    let finalConsignateur = selectedConsignateur;
    if (selectedConsignateur && selectedConsignateur.__isNew__) {
      const newPerson = { name: selectedConsignateur.label };
      if (selectedEntrepriseUtilisatrice) {
        newPerson.entreprise_id = Number(selectedEntrepriseUtilisatrice.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (error) console.error("Erreur lors de l'insertion du nouveau consignateur :", error);
      else {
        finalConsignateur = { value: Number(data[0].id), label: data[0].name };
        setConsignateurs((prev) => [...prev, finalConsignateur]);
      }
    }
    
    // Process the entreprise (from step 3)
    let finalEntreprise = selectedEntreprise;
    if (selectedEntreprise && selectedEntreprise.__isNew__) {
      const { data, error } = await supabase.from("entreprises").insert({ name: selectedEntreprise.label }).select();
      if (error) console.error("Erreur lors de l'insertion de la nouvelle entreprise :", error);
      else {
        finalEntreprise = { value: Number(data[0].id), label: data[0].name };
        setEntreprises((prev) => [...prev, finalEntreprise]);
      }
    }
    
    // Process the demandeur (which depends on the entreprise)
    let finalDemandeur = selectedDemandeur;
    if (selectedDemandeur && selectedDemandeur.__isNew__) {
      const newPerson = { name: selectedDemandeur.label };
      if (finalEntreprise) {
        newPerson.entreprise_id = Number(finalEntreprise.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (error) console.error("Erreur lors de l'insertion du nouveau demandeur :", error);
      else {
        finalDemandeur = { value: Number(data[0].id), label: data[0].name };
        setDemandeurs((prev) => [...prev, finalDemandeur]);
      }
    }
    
    // Build the payload (omitting demandeur fields) and force status to "planified"
    const updatedFormData = {
      ...formData,
      date_consignation: finalDate, // Use the finalDate from above
      entreprise_utilisatrice_id: selectedEntrepriseUtilisatrice ? Number(selectedEntrepriseUtilisatrice.value) : "",
      site_id: finalSite ? Number(finalSite.value) : "",
      zone_id: finalZone ? Number(finalZone.value) : "",
      consignateur_id: finalConsignateur ? Number(finalConsignateur.value) : "",
      entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      signature_consignateur:
        signaturePadConsignateur.current && !signaturePadConsignateur.current.isEmpty()
          ? signaturePadConsignateur.current.toDataURL()
          : "",
      // Omit demandeur fields
      signature_demandeur: "",
      signature_attestation:
        signaturePadAttestation.current && !signaturePadAttestation.current.isEmpty()
          ? signaturePadAttestation.current.toDataURL()
          : "",
      status: "planified",
      created_by: user.id,
      updated_by: user.id,
    };
    
    const { types_consignation , consigne_pour_ee , ...dataToInsert } = updatedFormData;
    const { data, error } = await supabase.from("consignations").insert([dataToInsert]).select();
    if (error) {
      console.error("Erreur lors de l'insertion de la consignation planifiée :", error);
      return;
    }
    console.log("Consignation planifiée insérée avec succès !", dataToInsert);
    navigate("/consignationplanified");
    
    // (Optional) Process types_consignations if needed.
  };



























  return (
    <>
      {/* <Navbar /> peut être activé si nécessaire */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-12 bg-white p-6 shadow-md rounded-lg">
    {currentStep === 1 && (
      <div className="border-b border-gray-900/10 pb-12">
        <h2 className="text-base font-semibold text-gray-900">BORDEREAU DE CONSIGNATION - DÉCONSIGNATION</h2>
        <p className="mt-1 text-sm text-gray-600">Fournissez les détails du site et des travaux.</p>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          {/* Site (if applicable) */}
          {role !== "technicien" && (
            <div className="sm:col-span-1">
              <label htmlFor="site_id" className="block text-sm font-medium text-gray-900">
                Site
              </label>
              <CreatableSelect
                id="site_id"
                name="site_id"
                value={selectedSite}
                onChange={(value) => setSelectedSite(value)}
                options={sites}
                isClearable
                placeholder="Sélectionnez ou créez un site..."
                className="mt-2"
              />
              {errors.site_id && (
                <p className="mt-2 text-sm text-red-600">{errors.site_id.join(", ")}</p>
              )}
            </div>
          )}
          {/* Zone */}
          <div className="sm:col-span-1">
            <label htmlFor="zone_id" className="block text-sm font-medium text-gray-900">
              Zone
            </label>
            <CreatableSelect
              id="zone_id"
              name="zone_id"
              value={selectedZone}
              onChange={(value) => setSelectedZone(value)}
              options={siteZones}
              isClearable
              placeholder="Sélectionnez ou créez une zone..."
              className="mt-2"
            />
            {errors.zone_id && (
              <p className="mt-2 text-sm text-red-600">{errors.zone_id.join(", ")}</p>
            )}
          </div>
          {/* Type de consignation */}
          <div className="sm:col-span-2">
            <label htmlFor="type_consignation" className="block text-sm font-medium text-gray-900">
              Type de consignation
            </label>
            <Select
              id="type_consignation"
              name="type_consignation"
              isMulti
              options={types_consignations}
              value={types_consignations.filter((option) =>
                formData.types_consignation.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                const selectedValues = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
                setFormData((prev) => ({ ...prev, types_consignation: selectedValues }));
                setSelectedTypesconsignations(selectedValues);
              }}
              placeholder="Sélectionnez des types..."
              className="mt-2"
            />
            {errors.types_consignation_id && (
              <p className="mt-2 text-sm text-red-600">{errors.types_consignation_id.join(", ")}</p>
            )}
          </div>
          {/* Désignation des Travaux – full width */}
          <div className="sm:col-span-2">
            <label htmlFor="designation_travaux" className="block text-sm font-medium text-gray-900">
              Désignation des Travaux
            </label>
            <textarea
              id="designation_travaux"
              name="designation_travaux"
              value={formData.designation_travaux}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
            ></textarea>
            {errors.designation_travaux && (
              <p className="mt-2 text-sm text-red-600">{errors.designation_travaux.join(", ")}</p>
            )}
          </div>
          {/* Équipements */}
          <div className="sm:col-span-1">
            <label htmlFor="equipements" className="block text-sm font-medium text-gray-900">
              Équipements
            </label>
            <textarea
              id="equipements"
              name="equipements"
              value={formData.equipements}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
            ></textarea>
            {errors.equipements && (
              <p className="mt-2 text-sm text-red-600">{errors.equipements.join(", ")}</p>
            )}
          </div>
          {/* Plan de prévention */}
          <div className="sm:col-span-1">
            <label htmlFor="pdp" className="block text-sm font-medium text-gray-900">
              Plan de prévention
            </label>
            <textarea
              id="pdp"
              name="pdp"
              value={formData.pdp}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
            ></textarea>
            {errors.pdp && (
              <p className="mt-2 text-sm text-red-600">{errors.pdp.join(", ")}</p>
            )}
          </div>
          {/* Numéro de cadenas */}
          <div className="sm:col-span-1">
            <label htmlFor="cadenas_num" className="block text-sm font-medium text-gray-900">
              Numéro de cadenas
            </label>
            <input
              id="cadenas_num"
              type="text"
              name="cadenas_num"
              value={formData.cadenas_num}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
            />
            {errors.cadenas_num && (
              <p className="mt-2 text-sm text-red-600">{errors.cadenas_num.join(", ")}</p>
            )}
          </div>
          {/* Lockbox */}
          <div className="sm:col-span-1">
            <label htmlFor="lockbox" className="block text-sm font-medium text-gray-900">
              Lockbox
            </label>
            <input
              id="lockbox"
              type="text"
              name="lockbox"
              value={formData.lockbox}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
            />
            {errors.lockbox && (
              <p className="mt-2 text-sm text-red-600">{errors.lockbox.join(", ")}</p>
            )}
          </div>
        </div>
      </div>
    )}

          {/* Étape 2 – Détails du consignateur avec sélection de l'entreprise */}
          {currentStep === 2 && (
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold text-gray-900">BORDEREAU DE CONSIGNATION - DÉCONSIGNATION</h2>
              <p className="mt-1 text-sm text-gray-600">Détails du consignateur</p>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {/* Sélection de l'entreprise */}
                {role === "technicien" ? (
                  <></>
                ) : (
                  <div className="sm:col-span-6">
                    <label htmlFor="entreprise_id" className="block text-sm font-medium text-gray-900">
                      Entreprise
                    </label>
                    <CreatableSelect
                      id="entreprise_id"
                      name="entreprise_id"
                      value={selectedEntrepriseUtilisatrice}
                      onChange={(value) => setSelectedEntrepriseUtilisatrice(value)}
                      options={entreprises}
                      isClearable
                      placeholder="Sélectionnez ou créez une entreprise..."
                      className="mt-2"
                    />
                    {errors.entreprise_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.entreprise_id.join(", ")}</p>
                    )}
                  </div>
                )}
                {/* Sélection du consignateur (filtré par l'entreprise si disponible) */}
                <div className="sm:col-span-6">
                  <label htmlFor="consignateur_id" className="block text-sm font-medium text-gray-900">
                    Consignateur
                  </label>
                  <CreatableSelect
                    id="consignateur_id"
                    name="consignateur_id"
                    value={selectedConsignateur}
                    onChange={(value) => setSelectedConsignateur(value)}
                    options={entreprisePersons}
                    isClearable
                    placeholder="Sélectionnez ou créez un consignateur..."
                    className="mt-2"
                  />
                  {errors.consignateur_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.consignateur_id.join(", ")}</p>
                  )}
                </div>
                {/* Signature du consignateur */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-900">Signature du consignateur</label>
                  <canvas ref={sigPadConsignateur} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                  <button
                    type="button"
                    onClick={clearSignatureConsignateur}
                    className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Effacer la signature
                  </button>
                  {errors.signature_consignateur && (
                    <p className="mt-2 text-sm text-red-600">{errors.signature_consignateur.join(", ")}</p>
                  )}
                </div>
                {/* Cases à cocher */}
                <div className="sm:col-span-3">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                  <input
  type="checkbox"
  name="consigne_pour_moi"
  checked={formData.consigne_pour_moi}
  onChange={() => setFormData((prev) => ({
    ...prev,
    consigne_pour_moi: true,
    consigne_pour_ee: false, // Uncheck the other checkbox
  }))}
/>

                    Consigné pour moi-même
                  </label>
                </div>
                <div className="sm:col-span-3">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                  <input
  type="checkbox"
  name="consigne_pour_ee"
  checked={!formData.consigne_pour_moi}
  onChange={() => setFormData((prev) => ({
    ...prev,
    consigne_pour_moi: false, // Uncheck the other checkbox
    consigne_pour_ee: true,
  }))}
/>
                    Consigné pour ee
                  </label>
                </div>
                <div className="sm:col-span-3">
                <div className="sm:col-span-3">
  <label className="flex items-center text-sm font-medium text-gray-900">
    <input
      type="checkbox"
      name="info_salle_controle"
      checked={formData.info_salle_controle}
      onChange={handleChange}
      className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
    />
    Informer la salle de contrôle
  </label>
  {errors.info_salle_controle && (
    <p className="mt-2 text-sm text-red-600">{errors.info_salle_controle.join(", ")}</p>
  )}
</div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 – Détails du demandeur et de l'entreprise */}
          {currentStep === 3 &&
            (!formData.consigne_pour_moi ? (
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-base font-semibold text-gray-900">BORDEREAU DE CONSIGNATION - DÉCONSIGNATION</h2>
                <p className="mt-1 text-sm text-gray-600">Détails du demandeur et de l'entreprise</p>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {/* Sélection de l'entreprise extérieure */}
                  <div className="sm:col-span-3">
                    <label htmlFor="entreprise_id" className="block text-sm font-medium text-gray-900">
                      Entreprise extérieure
                    </label>
                    <CreatableSelect
                      id="entreprise_id"
                      name="entreprise_id"
                      value={selectedEntreprise}
                      onChange={(value) => setSelectedEntreprise(value)}
                      options={entreprises}
                      isClearable
                      placeholder="Sélectionnez ou créez une entreprise..."
                      className="mt-2"
                    />
                    {errors.entreprise_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.entreprise_id.join(", ")}</p>
                    )}
                  </div>
                  {/* Sélection du demandeur – si une entreprise est sélectionnée, afficher les personnes de l'entreprise ; sinon afficher la liste complète */}
                  <div className="sm:col-span-3">
                    <label htmlFor="demandeur_id" className="block text-sm font-medium text-gray-900">
                      Demandeur
                    </label>
                    <CreatableSelect
                      id="demandeur_id"
                      name="demandeur_id"
                      value={selectedDemandeur}
                      onChange={(value) => setSelectedDemandeur(value)}
                      options={entreprisePersons}
                      isClearable
                      placeholder="Sélectionnez ou créez un demandeur..."
                      className="mt-2"
                    />
                    {errors.demandeur_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.demandeur_id.join(", ")}</p>
                    )}
                  </div>
                </div>
                {/* Signature du demandeur */}
                <div className="sm:col-span-6 mt-10">
                  <label className="block text-sm font-medium text-gray-900">Signature du demandeur</label>
                  <canvas ref={sigPadDemandeur} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                  <button
                    type="button"
                    onClick={clearSignatureDemandeur}
                    className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Effacer la signature
                  </button>
                  {errors.signature_demandeur && (
                    <p className="mt-2 text-sm text-red-600">{errors.signature_demandeur.join(", ")}</p>
                  )}
                </div>
              </div>
            ) : (
              // Si "consigné pour moi" est coché, conserver la sélection d'entreprise de l'étape 2 et auto-attribuer le demandeur comme consignateur.
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-base font-semibold text-gray-900">Détails du demandeur et de l'entreprise</h2>
                <p className="mt-1 text-sm text-gray-600">Détails du demandeur et de l'entreprise</p>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {/* Champ entreprise – désactivé */}
                  <div className="sm:col-span-3">
                    <label htmlFor="entreprise_id" className="block text-sm font-medium text-gray-900">
                      Entreprise extérieure
                    </label>
                    <CreatableSelect
                      id="entreprise_id"
                      name="entreprise_id"
                      value={selectedEntreprise}
                      onChange={(value) => setSelectedEntreprise(value)}
                      options={entreprises}
                      isClearable
                      placeholder="Sélectionnez ou créez une entreprise..."
                      className="mt-2"
                      isDisabled
                    />
                    {errors.entreprise_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.entreprise_id.join(", ")}</p>
                    )}
                  </div>
                  {/* Champ demandeur – désactivé et auto-attribué */}
                  <div className="sm:col-span-3">
                    <label htmlFor="demandeur_id" className="block text-sm font-medium text-gray-900">
                      Demandeur
                    </label>
                    <CreatableSelect
                      id="demandeur_id"
                      name="demandeur_id"
                      value={selectedConsignateur}
                      onChange={(value) => setSelectedDemandeur(value)}
                      options={demandeurs}
                      isClearable
                      placeholder="Sélectionnez ou créez un demandeur..."
                      className="mt-2"
                      isDisabled
                    />
                  </div>
                </div>
                {/* Signature du demandeur */}
                <div className="sm:col-span-6 mt-10">
                  <label className="block text-sm font-medium text-gray-900">Signature du demandeur</label>
                  <canvas ref={sigPadDemandeur} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                  <button
                    type="button"
                    onClick={clearSignatureDemandeur}
                    className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Effacer la signature
                  </button>
                  {errors.signature_demandeur && (
                    <p className="mt-2 text-sm text-red-600">{errors.signature_demandeur.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}

          {/* Étape 4 – Revue finale et soumission */}
          {currentStep === 4 && (
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold text-gray-900">Étape finale</h2>
              <p className="mt-1 text-sm text-gray-600">
                Fournissez la signature du demandeur et vérifiez les détails.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {/* Date de consignation */}
                <div className="sm:col-span-6">
                  <label htmlFor="date_consignation" className="block text-sm font-medium text-gray-900">
                    Date de consignation
                  </label>
                  <input
                    id="date_consignation"
                    type="datetime-local"
                    name="date_consignation"
                    value={formData.date_consignation}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date_consignation: e.target.value }))
                    }
                    className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                  />
                </div>
                {/* Déclaration */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-900">Déclaration</label>
                  <p className="mt-2 text-sm text-gray-600">
                    Je soussigné M. {selectedDemandeur ? selectedDemandeur.label : "N/A"} de l'entreprise{" "}
                    {selectedEntreprise ? selectedEntreprise.label : "N/A"} chargé des travaux ci-dessus désignés,
                    déclare avoir reçu le présent avis de consignation et pris connaissance des prescriptions de sécurité.
                  </p>
                </div>
                {/* Signature d'attestation */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-900">Signature d'attestation</label>
                  <canvas ref={sigPadAttestation} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                  <button
                    type="button"
                    onClick={clearSignatureAttestation}
                    className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Effacer la signature
                  </button>
                  {errors.signature_attestation && (
                    <p className="mt-2 text-sm text-red-600">{errors.signature_attestation.join(", ")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          {currentStep === 1 && (
            <div className="mt-6 flex items-center justify-between gap-x-6">
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-300"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Suivant
              </button>
            </div>
          )}

{currentStep !== 1 && (
  <div className="mt-6 flex items-center justify-end gap-x-6">
    {currentStep === 3 && (
  <button
    type="button"
    onClick={handlePlanifiedClick}
    className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
  >
    Ajouter comme planifié
  </button>
)}
    {currentStep > 1 && (
      <button
        type="button"
        onClick={handlePreviousStep}
        className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-300"
      >
        Précédent
      </button>
    )}
    {currentStep < 4 && currentStep > 1 && (
      <button
        type="button"
        onClick={handleNextStep}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Suivant
      </button>
    )}
    {currentStep === 4 && (
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Envoyer
      </button>
    )}
  </div>
)}

        </form>
      </div>
      {showTimeDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">Sélectionnez la date et l'heure</h3>
      <input
        type="datetime-local"
        value={datetimeValue}
        onChange={(e) => setDatetimeValue(e.target.value)}
        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setShowTimeDialog(false)}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleDatetimeConfirm}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
)}
    </>
    
  );
};




export default AddConsignation;






//firebase hosting:channel:deploy just-testing