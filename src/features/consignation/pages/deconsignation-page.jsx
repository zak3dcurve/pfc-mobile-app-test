import { useAuth } from "@/features/auth/utils/auth-context";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import SignaturePad from "signature_pad";
import { useIsMobile } from "@/hooks/use-mobile";

const DeconsignationPage = () => {
  const navigate = useNavigate();
  const { role, site, entreprise } = useAuth();
  const { id } = useParams();
  const isMobile = useIsMobile();

  // États de sélection
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [selectedEntrepriseUtilisatrice, setSelectedEntrepriseUtilisatrice] = useState(null);
  const [selectedDemandeur, setSelectedDemandeur] = useState(null);
  const [selectedDeconsignateur, setSelectedDeconsignateur] = useState(null);

  // Tableaux de données récupérées
  const [entreprises, setEntreprises] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [entreprisePersons, setEntreprisePersons] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({}); // Autres champs du formulaire si besoin
  const [step, setStep] = useState(1);

  // Nouvel état pour les cases obligatoires
  const [checkboxStep1, setCheckboxStep1] = useState(false);
  const [checkboxStep2, setCheckboxStep2] = useState(false);

  // Références pour SignaturePad
  const sigPadDemandeur = useRef(null);
  const sigPadDeconsignateur = useRef(null);
  const signaturePadDemandeur = useRef(null);
  const signaturePadDeconsignateur = useRef(null);

  const [showForcedDialog, setShowForcedDialog] = useState(false);
  const [forcedReason, setForcedReason] = useState("");

  // Récupération des données d'entreprise et de demandeur au montage
  useEffect(() => {
    const fetchData = async () => {
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from("entreprises")
        .select("id, name, persons(id, name)");
      const { data: demandeurData, error: demandeurError } = await supabase
        .from("persons")
        .select("id, name");

      if (entrepriseError || demandeurError) {
        console.error("Erreur lors de la récupération des données", entrepriseError, demandeurError);
        return;
      }

      setEntreprises(
        (entrepriseData || []).map((ent) => ({
          value: ent.id,
          label: ent.name,
          persons: ent.persons,
        }))
      );
      setDemandeurs(
        (demandeurData || []).map((dem) => ({ value: dem.id, label: dem.name }))
      );
    };

    fetchData();
  }, []);


useEffect(() => {
  const fetchConsignation = async () => {
    // Only proceed if we have an ID
    if (id) {
      // Fetch the consignation record with its related data
      const { data, error } = await supabase
        .from("consignations")
        .select(`
          *,
          entreprise:entreprise_id(id, name),
          demandeur:demandeur_id(id, name, entreprise_id)
        `)
        .eq("id", Number(id))
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération de la consignation:", error);
        return;
      }
      
      // If we have data with entreprise, set the selectedEntreprise
      if (data && data.entreprise) {
        const entrepriseOption = {
          value: data.entreprise.id,
          label: data.entreprise.name
        };
        setSelectedEntreprise(entrepriseOption);
        
        // Then fetch all persons for this entreprise to populate the entreprisePersons list
        const { data: personsData, error: personsError } = await supabase
          .from("persons")
          .select("id, name")
          .eq("entreprise_id", data.entreprise.id);
          
        if (!personsError && personsData) {
          const personOptions = personsData.map(p => ({ 
            value: p.id, 
            label: p.name 
          }));
          
          setEntreprisePersons(personOptions);
          
          // Now set the selectedDemandeur if we have one
          if (data.demandeur) {
            const demandeurOption = {
              value: data.demandeur.id,
              label: data.demandeur.name
            };
            setSelectedDemandeur(demandeurOption);
          }
        }
      }
    }
  };

  // Call the function when the component mounts and entreprises are loaded
  if (entreprises.length > 0) {
    fetchConsignation();
  }
}, [id, entreprises]);


  // Mise à jour de entreprisePersons quand selectedEntreprise change
  useEffect(() => {
    if (selectedEntreprise) {
      const enterprise = entreprises.find((ent) => ent.value === selectedEntreprise.value);
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

  // Mise à jour de entreprisePersons aussi quand selectedEntrepriseUtilisatrice change
  useEffect(() => {
    if (selectedEntrepriseUtilisatrice) {
      const enterprise = entreprises.find((ent) => ent.value === selectedEntrepriseUtilisatrice.value);
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
  }, [selectedEntrepriseUtilisatrice, entreprises, step]);

  // Pour les techniciens, auto‑attribuer selectedEntrepriseUtilisatrice depuis l'entreprise connectée
  useEffect(() => {
    if (entreprise && entreprises.length > 0) {
      const matchingEntreprise = entreprises.find((e) => e.value === entreprise.id);
      if (matchingEntreprise) {
        setSelectedEntrepriseUtilisatrice(matchingEntreprise);
      }
    }
  }, [role, entreprise, entreprises]);

  // Vider les personnes lorsque l'entreprise change
  useEffect(() => {
    if (selectedDeconsignateur) {
      setSelectedDeconsignateur(null);
    }
  }, [selectedEntrepriseUtilisatrice]);

const [isInitialLoad, setIsInitialLoad] = useState(true);

// Modify the useEffect that fetches consignation data to set isInitialLoad to false when done
useEffect(() => {
  const fetchConsignation = async () => {
    // ... your copied code to fetch consignation ...
    
    // Add this at the end of the function
    setIsInitialLoad(false);
  };

  if (entreprises.length > 0 && isInitialLoad) {
    fetchConsignation();
  }
}, [id, entreprises, isInitialLoad]);

// Then modify the useEffect that clears selectedDemandeur
useEffect(() => {
  if (selectedDemandeur && !isInitialLoad) {
    setSelectedDemandeur(null);
  }
}, [selectedEntreprise, isInitialLoad]);


  // Initialiser SignaturePad sur le canvas en fonction de l'étape
  useEffect(() => {
    const setupSignaturePad = (canvasRef, signaturePadRef) => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        const containerWidth = container.offsetWidth;
        const canvasHeight = isMobile ? 120 : 160;

        // Set canvas dimensions based on container
        canvas.width = containerWidth - 4; // Account for border
        canvas.height = canvasHeight;

        // Set CSS dimensions to match
        canvas.style.width = `${containerWidth - 4}px`;
        canvas.style.height = `${canvasHeight}px`;

        // Clear any existing signature pad
        if (signaturePadRef.current) {
          signaturePadRef.current.off();
        }

        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: 'rgba(255,255,255,0)',
          penColor: 'rgb(0, 0, 0)',
          velocityFilterWeight: 0.7,
          minWidth: isMobile ? 1 : 0.5,
          maxWidth: isMobile ? 3 : 2.5,
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (step === 1) {
        setupSignaturePad(sigPadDemandeur, signaturePadDemandeur);
      }
      if (step === 2) {
        setupSignaturePad(sigPadDeconsignateur, signaturePadDeconsignateur);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [step, isMobile]);

  // Mise à jour de formData pour les inputs non checkbox
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Validation de l'étape – vérification que la case correspondante est cochée
  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (!selectedEntreprise)
        newErrors.entreprise_id = ["L'entreprise est requise"];
      if (!selectedDemandeur)
        newErrors.demandeur_id = ["Le demandeur est requis"];
      if (!signaturePadDemandeur.current || signaturePadDemandeur.current.isEmpty()) {
        newErrors.signature_demandeur = ["La signature est requise"];
      }
      if (!checkboxStep1) {
        newErrors.checkboxStep1 = "Vous devez confirmer cette déclaration pour continuer.";
      }
    }

    if (step === 2) {
      if (!selectedEntrepriseUtilisatrice)
        newErrors.entreprise_id = ["L'entreprise utilisatrice est requise"];
      if (!selectedDeconsignateur)
        newErrors.deconsignateur_id = ["Le déconsignateur est requis"];
      if (!signaturePadDeconsignateur.current || signaturePadDeconsignateur.current.isEmpty()) {
        newErrors.signature_deconsignateur = ["La signature est requise"];
      }
      if (!checkboxStep2) {
        newErrors.checkboxStep2 = "Vous devez confirmer cette déclaration pour continuer.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des étapes de navigation
  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep(2);
    }
  };

  // Bouton supplémentaire pour "Déconsignation forcée"
  const handleDeconsignationForcée = () => {
    if (window.confirm("Voulez-vous forcer la déconsignation ?")) {
      // Optionnel : vous pouvez définir un flag ou simplement continuer
      setStep(2);
    }
  };

  // Gestion finale de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    // Traitement pour le nouveau déconsignateur – inclure l'id de l'entreprise utilisatrice si disponible
    let finalDeconsignateur = selectedDeconsignateur;
    if (selectedDeconsignateur && selectedDeconsignateur.__isNew__) {
      const newPerson = { name: selectedDeconsignateur.label };
      if (selectedEntrepriseUtilisatrice) {
        newPerson.entreprise_id = Number(selectedEntrepriseUtilisatrice.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (error) console.error("Erreur lors de l'insertion du nouveau déconsignateur :", error);
      else {
        finalDeconsignateur = { value: Number(data[0].id), label: data[0].name };
      }
    }

    // Process the new entreprise first
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

    // Then process the new demandeur using the persisted entreprise id
    let finalDemandeur = selectedDemandeur;
    if (selectedDemandeur && selectedDemandeur.__isNew__) {
      const newPerson = { name: selectedDemandeur.label };
      if (finalEntreprise) { // Use finalEntreprise instead of selectedEntreprise
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
      deconsignateur_id: finalDeconsignateur ? Number(finalDeconsignateur.value) : "",
      demandeur_id: finalDemandeur ? Number(finalDemandeur.value) : "",
      entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      signature_deconsignateur:
        signaturePadDeconsignateur.current && !signaturePadDeconsignateur.current.isEmpty()
          ? signaturePadDeconsignateur.current.toDataURL()
          : "",
      signature_demandeur:
        signaturePadDemandeur.current && !signaturePadDemandeur.current.isEmpty()
          ? signaturePadDemandeur.current.toDataURL()
          : "",
    };

    // Inclure les données additionnelles, par ex. l'id de la consignation depuis les paramètres
    const dataToInsert = { ...updatedFormData, consignation_id: Number(id) };

    const { data, error } = await supabase.from("deconsignations").insert([dataToInsert]).select();
    if (error) {
      console.error("Erreur lors de l'insertion de la déconsignation :", error);
      console.error("Données tentées :", dataToInsert);
      return;
    }

    // New code for multi-consignation handling
    try {
      // First, get the current consignation to check if it's part of a multi-consignation
      const { data: currentConsignation } = await supabase
        .from("consignations")
        .select("multi_consignation_id")
        .eq("id", Number(id))
        .single();
      
      if (currentConsignation?.multi_consignation_id) {
        // Check if it's the last active consignation in the group
        const { data: activeConsignations } = await supabase
          .from("consignations")
          .select("id")
          .eq("multi_consignation_id", currentConsignation.multi_consignation_id)
          .in("status", ["pending", "confirmed"]);
        
        // Count how many active consignations remain (including this one)
        const activeCount = activeConsignations?.length || 0;
        
        if (activeCount > 1) {
          // This is NOT the last active consignation, so auto-archive it
          await supabase
            .from("consignations")
            .update({ status: "archived" })
            .eq("id", Number(id));
            
          console.log("Consignation automatiquement archivée (partie d'une multi-consignation)");
          navigate("/consignationlist");
        } else {
          // This IS the last active consignation, mark as deconsigné and go to details
          await supabase
            .from("consignations")
            .update({ status: "deconsigné" })
            .eq("id", Number(id));
            
          console.log("Dernière consignation dans le groupe, marquée comme déconsignée");
          navigate(`/consignationdetails/${id}`);
        }
      } else {
        // Not part of a multi-consignation, regular flow
        await supabase
          .from("consignations")
          .update({ status: "deconsigné" })
          .eq("id", Number(id));
          
        console.log("Consignation individuelle déconsignée");
        navigate("/consignationlist");
      }
    } catch (err) {
      console.error("Erreur inattendue :", err);
      navigate("/consignationlist");
    }
  };

  const handleSubmitCaseDecForcee = async () => {
    if (!validateStep()) return;

    let finalDemandeur = selectedDemandeur;
    if (selectedDemandeur && selectedDemandeur.__isNew__) {
      const newPerson = { name: selectedDemandeur.label };
      if (selectedEntreprise) {
        newPerson.entreprise_id = Number(selectedEntreprise.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (error) console.error("Erreur lors de l'insertion du nouveau demandeur :", error);
      else {
        finalDemandeur = { value: Number(data[0].id), label: data[0].name };
      }
    }

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

    // Construction du payload final.
    const updatedFormData = {
      ...formData,
      entreprise_utilisatrice_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      deconsignateur_id: finalDemandeur ? Number(finalDemandeur.value) : "",
      demandeur_id: finalDemandeur ? Number(finalDemandeur.value) : "",
      entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      signature_deconsignateur:
        signaturePadDemandeur.current && !signaturePadDemandeur.current.isEmpty()
          ? signaturePadDemandeur.current.toDataURL()
          : "",
      signature_demandeur:
        signaturePadDemandeur.current && !signaturePadDemandeur.current.isEmpty()
          ? signaturePadDemandeur.current.toDataURL()
          : "",
      deconsignation_forcee: showForcedDialog,
      deconsignation_forcee_motif: forcedReason,
    };

    const dataToInsert = { ...updatedFormData, consignation_id: Number(id) };

    const { data, error } = await supabase.from("deconsignations").insert([dataToInsert]).select();
    if (error) {
      console.error("Erreur lors de l'insertion de la déconsignation :", error);
      console.error("Données tentées :", dataToInsert);
      return;
    }

    // New code for multi-consignation handling
    try {
      // First, get the current consignation to check if it's part of a multi-consignation
      const { data: currentConsignation } = await supabase
        .from("consignations")
        .select("multi_consignation_id")
        .eq("id", Number(id))
        .single();
      
      if (currentConsignation?.multi_consignation_id) {
        // Check if it's the last active consignation in the group
        const { data: activeConsignations } = await supabase
          .from("consignations")
          .select("id")
          .eq("multi_consignation_id", currentConsignation.multi_consignation_id)
          .in("status", ["pending", "confirmed"]);
        
        // Count how many active consignations remain (including this one)
        const activeCount = activeConsignations?.length || 0;
        
        if (activeCount > 1) {
          // This is NOT the last active consignation, so auto-archive it
          await supabase
            .from("consignations")
            .update({ status: "archived" })
            .eq("id", Number(id));
            
          console.log("Consignation automatiquement archivée (partie d'une multi-consignation)");
          navigate("/consignationlist");
        } else {
          // This IS the last active consignation, mark as deconsigné and go to details
          await supabase
            .from("consignations")
            .update({ status: "deconsigné" })
            .eq("id", Number(id));
            
          console.log("Dernière consignation dans le groupe, marquée comme déconsignée");
          navigate(`/consignationdetails/${id}`);
        }
      } else {
        // Not part of a multi-consignation, regular flow
        await supabase
          .from("consignations")
          .update({ status: "deconsigné" })
          .eq("id", Number(id));
          
        console.log("Consignation individuelle déconsignée");
        navigate("/consignationlist");
      }
    } catch (err) {
      console.error("Erreur inattendue :", err);
      navigate("/consignationlist");
    }
  };

  const disabled = role === "technicien" ? true : false;

  // Fonctions pour effacer les signatures
  const clearSignatureDemandeur = () => {
    if (signaturePadDemandeur.current) {
      signaturePadDemandeur.current.clear();
    }
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const clearSignatureDeconsignateur = () => {
    if (signaturePadDeconsignateur.current) {
      signaturePadDeconsignateur.current.clear();
    }
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleReturn = () => {
    console.log(navigate(-1));
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 pt-20">
        <form className="w-full max-w-4xl space-y-12 bg-white p-6 shadow-md rounded-lg" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold text-gray-900">
                Fournissez les informations du demandeur et de l'entreprise.
              </h2>
              <p className="mt-1 text-sm text-gray-600">Fournissez le demandeur et la signature.</p>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {/* Sélection de l'entreprise */}
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
                {/* Sélection du demandeur */}
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 touch-manipulation mt-2">
                  <canvas
                    ref={sigPadDemandeur}
                    className="w-full border border-gray-200 rounded bg-white touch-none"
                    style={{ touchAction: 'none' }}
                  />
                </div>
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
              {/* Case à cocher étape 1 */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkboxStep1"
                    checked={checkboxStep1}
                    onChange={(e) => setCheckboxStep1(e.target.checked)}
                    className="mr-2"
                  />
                  <span>
                    JE DÉCLARE QUE LES TRAVAUX OBJET DE LA PRÉSENTE CONSIGNATION ONT ÉTÉ ACHEVÉS. EN CONSÉQUENCE DE QUOI L'OUVRAGE REMIS EN BON ORDRE PEUT ÊTRE DÉCONSIGNÉ.
                  </span>
                </label>
                {errors.checkboxStep1 && <p className="mt-1 text-red-600">{errors.checkboxStep1}</p>}
              </div>
              {/* Boutons de navigation pour l'étape 1 */}
              <div className="mt-6 flex items-center justify-between gap-x-6">
                <button
                  type="button"
                  onClick={handleReturn}
                  className="rounded-md bg-fuchsia-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-500"
                >
                  Retour
                </button>
                <div className="flex gap-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep()) {
                        setShowForcedDialog(true);
                      }
                    }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                  >
                    Déconsignation forcée
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold text-gray-900">
                Fournissez les informations du déconsignateur et de l'entreprise.
              </h2>
              <p className="mt-1 text-sm text-gray-600">Fournissez le déconsignateur et la signature.</p>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {/* Sélection de l'entreprise utilisatrice (désactivé) */}
                <div className="sm:col-span-3">
                  <label htmlFor="entreprise_id" className="block text-sm font-medium text-gray-900">
                    Entreprise utilisatrice
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
                    isDisabled={disabled}
                  />
                  {errors.entreprise_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.entreprise_id.join(", ")}</p>
                  )}
                </div>
                {/* Sélection du déconsignateur */}
                <div className="sm:col-span-3">
                  <label htmlFor="demandeur_id" className="block text-sm font-medium text-gray-900">
                    Déconsignateur
                  </label>
                  <CreatableSelect
                    id="demandeur_id"
                    name="demandeur_id"
                    value={selectedDeconsignateur}
                    onChange={(value) => setSelectedDeconsignateur(value)}
                    options={entreprisePersons}
                    isClearable
                    placeholder="Sélectionnez ou créez un déconsignateur..."
                    className="mt-2"
                  />
                  {errors.deconsignateur_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.deconsignateur_id.join(", ")}</p>
                  )}
                </div>
              </div>
              {/* Signature du déconsignateur */}
              <div className="sm:col-span-6 mt-10">
                <label className="block text-sm font-medium text-gray-900">Signature du déconsignateur</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 touch-manipulation mt-2">
                  <canvas
                    ref={sigPadDeconsignateur}
                    className="w-full border border-gray-200 rounded bg-white touch-none"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignatureDeconsignateur}
                  className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Effacer la signature
                </button>
                {errors.signature_deconsignateur && (
                  <p className="mt-2 text-sm text-red-600">{errors.signature_deconsignateur.join(", ")}</p>
                )}
              </div>
              {/* Case à cocher étape 2 */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkboxStep2"
                    checked={checkboxStep2}
                    onChange={(e) => setCheckboxStep2(e.target.checked)}
                    className="mr-2"
                  />
                  <span>
                    JE DÉCLARE AVOIR INFORMÉ LA SALLE DE CONTRÔLE ET RENSEIGNÉ LE CAHIER DES CONSIGNATIONS DE L'ENTREPRISE UTILISATRICE.
                  </span>
                </label>
                {errors.checkboxStep2 && <p className="mt-1 text-red-600">{errors.checkboxStep2}</p>}
              </div>
              {/* Boutons de navigation pour l'étape 2 */}
              <div className="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-300"
                >
                  Précédent
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {showForcedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Déconsignation forcée</h3>
            <p className="mb-4">
              Veuillez fournir un motif pour la déconsignation forcée :
            </p>
            <textarea
              value={forcedReason}
              onChange={(e) => setForcedReason(e.target.value)}
              rows={4}
              className="w-full resize-none rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Entrez votre motif ici..."
            ></textarea>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForcedDialog(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSubmitCaseDecForcee();
                  setShowForcedDialog(false);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
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

export default DeconsignationPage;