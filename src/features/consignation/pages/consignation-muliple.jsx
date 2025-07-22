import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/utils/auth-context";
import CreatableSelect from "react-select/creatable";
// Import the signature component from react-signature-canvas
import SignatureCanvas from "react-signature-canvas";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const AddMultiConsignation = () => {
  const { id: parentId } = useParams(); // Parent consignation ID
  const navigate = useNavigate();
  const { user } = useAuth();

  // Parent (common) consignation info
  const [parentConsignation, setParentConsignation] = useState(null);
  const [loadingParent, setLoadingParent] = useState(true);

  // Options for the entreprise and its persons (for the new demandeur)
  const [entreprises, setEntreprises] = useState([]);
  const [demandeursOptions, setDemandeursOptions] = useState([]);

  // Local state for the new (non‑common) fields and new demandeur info
  const [formData, setFormData] = useState({
    designation_travaux_multi: "",
    pdp_multi: "",
    cadenas_num_multi: "",
    // ... add more unique fields here if needed
  });

  // State for the selected external entreprise (for the new multi‑record)
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  // State for the selected new demandeur (dependent on selected entreprise)
  const [selectedDemandeur, setSelectedDemandeur] = useState(null);

  // Reference for the demandeur signature using SignatureCanvas
  const sigPadDemandeur = useRef(null);

 useEffect(() => {
  const fetchParent = async () => {
    const { data, error } = await supabase
      .from("consignations")
      .select(`
        *, 
        entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name, id),
        zones(name),
        consignateur:persons!consignations_consignateur_id_fkey(name)
      `)
      .eq("id", parentId)
      .single();
      
    if (error) {
      console.error("Erreur lors de la récupération de la consignation parente :", error);
    } else {
      setParentConsignation(data);
      console.log("Parent Consignation Data:", data);
    }
    setLoadingParent(false);
  };
  fetchParent();
}, [parentId]);

  // Fetch entreprises list for the external entreprise selection
  useEffect(() => {
    const fetchEntreprises = async () => {
      const { data, error } = await supabase.from("entreprises").select("id, name, persons(id, name)");
      if (error) {
        console.error("Erreur lors de la récupération des entreprises :", error);
      } else {
        // Map to option format for CreatableSelect
        const options = (data || []).map((ent) => ({
          value: ent.id,
          label: ent.name,
          persons: ent.persons, // save persons to update demandeurs options later
        }));
        setEntreprises(options);
      }
    };
    fetchEntreprises();
  }, []);

  // Update demandeurs options when the selected entreprise changes
  useEffect(() => {
    if (selectedEntreprise && selectedEntreprise.persons) {
      const options = selectedEntreprise.persons.map((person) => ({
        value: person.id,
        label: person.name,
      }));
      setDemandeursOptions(options);
    } else {
      setDemandeursOptions([]);
    }
  }, [selectedEntreprise]);

  // Handler for input changes of additional fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Clear the signature using SignatureCanvas's clear method
  const clearSignature = () => {
    if (sigPadDemandeur.current) {
      sigPadDemandeur.current.clear();
    }
  };

  // Handler for form submission: build the payload and insert the new record
  const handleSubmit = async (e) => {
    e.preventDefault();






    // Basic validations
    if (!selectedEntreprise) {
      alert("Veuillez sélectionner ou créer une entreprise.");
      return;
    }
    if (!selectedDemandeur) {
      alert("Veuillez sélectionner ou créer un demandeur.");
      return;
    }
    if (sigPadDemandeur.current.isEmpty()) {
      alert("Veuillez fournir la signature du demandeur.");
      return;
    }
    if (!formData.designation_travaux_multi.trim()) {
      alert("La désignation spécifique des travaux est requise.");
      return;
    }
    
  let entrepriseId = selectedEntreprise.value;
  if (selectedEntreprise.__isNew__) {
    const { data, error } = await supabase
      .from("entreprises")
      .insert({ name: selectedEntreprise.label })
      .select();
    if (error) {
      console.error("Erreur lors de l'insertion de la nouvelle entreprise :", error);
      alert("Une erreur est survenue lors de la création de l'entreprise.");
      return;
    }
    entrepriseId = data[0].id;
  }
  
  // Handle newly created demandeur
  let demandeurId = selectedDemandeur.value;
  if (selectedDemandeur.__isNew__) {
    const { data, error } = await supabase
      .from("persons")
      .insert({ name: selectedDemandeur.label, entreprise_id: entrepriseId })
      .select();
    if (error) {
      console.error("Erreur lors de l'insertion du nouveau demandeur :", error);
      alert("Une erreur est survenue lors de la création du demandeur.");
      return;
    }
    demandeurId = data[0].id;
  }



    // Build payload: inherit parent's common data and add new unique data
    const payload = {
      site_id: parentConsignation.site_id,
      entreprise_utilisatrice_id:parentConsignation.entreprise_utilisatrice?.id || null, // New entreprise ID
      signature_consignateur: parentConsignation.signature_consignateur,
      multi_consignation_id: Number(parentId), // Link this new record to the parent
      date_consignation: parentConsignation.date_consignation,
      zone_id: parentConsignation.zones_id,
      consignateur_id: parentConsignation.consignateur_id,
      entreprise_id:  Number(entrepriseId),
      // Unique fields for the multi‑consignation:
      designation_travaux: formData.designation_travaux_multi,
      pdp: formData.pdp_multi,
      cadenas_num: formData.cadenas_num_multi,
      lockbox: parentConsignation.lockbox,
      // New demandeur and signature
      demandeur_id: Number(demandeurId),
      signature_demandeur: sigPadDemandeur.current.toDataURL(),
      // Audit and status fields:
      status: parentConsignation.status,
      created_by: user.id,
      updated_by: user.id,
      equipements: parentConsignation.equipements,
    };

    const { dat, erro } = await supabase.from("consignations").update({ multi_consignation_id: Number(parentId) })
      .eq("id", parentId);
      if (erro) {
        console.error("Erreur lors de l'insertion de la consignation multiple :", erro);
        alert("Une erreur est survenue lors de la création de la consignation multiple.");
        return;
      }
    

    // Insert the new multi‑consignation record
    const { data, error } = await supabase.from("consignations").insert([payload]).select();

    if (error) {
      console.error("Erreur lors de l'insertion de la consignation multiple :", error);
      alert("Une erreur est survenue lors de la création de la consignation multiple.");
      return;
    }
    console.log("Consignation multiple insérée avec succès !", data);
    navigate(`/multiconsdetails/${parentId}`);
  };

  if (loadingParent || !parentConsignation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 ">
        <div className="w-full max-w-2xl bg-white p-8 rounded shadow mt-20">
          <h1 className="text-3xl font-bold text-center mb-6">
            Ajouter une consignation multiple
          </h1>

          {/* Display Parent Consignation (common fields) */}
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Informations communes (parent)</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Date de consignation :</span>
                <span>{formatDateTime(parentConsignation.date_consignation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Zone :</span>
                <span>{parentConsignation.zones?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Consignateur :</span>
                <span>{parentConsignation.consignateur?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Entreprise du consignateur :</span>
                <span>{parentConsignation.entreprise_utilisatrice?.name || "Non défini"}</span>
              </div>
            </div>
          </div>

          {/* New Multi‑Consignation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Entreprise Selection (for new demandeur) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Entreprise extérieure
              </label>
              <CreatableSelect
                options={entreprises}
                value={selectedEntreprise}
                onChange={(value) => setSelectedEntreprise(value)}
                placeholder="Sélectionnez ou créez une entreprise..."
                className="mt-2"
              />
            </div>

            {/* 2. Demandeur (dependent on selected entreprise) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Demandeur (nouveau)
              </label>
              <CreatableSelect
                options={demandeursOptions}
                value={selectedDemandeur}
                onChange={(value) => setSelectedDemandeur(value)}
                placeholder="Sélectionnez ou créez un demandeur..."
                className="mt-2"
              />
            </div>

            {/* 3. Signature du Demandeur */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Signature du demandeur
              </label>
              {/* Use the SignatureCanvas component instead of <canvas> */}
              <SignatureCanvas
                ref={sigPadDemandeur}
                penColor="black"
                canvasProps={{
                  className: "mt-2 border rounded w-80 h-40 mx-auto",
                }}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Effacer la signature
              </button>
            </div>

            {/* 4. Champs spécifiques (non‑communs) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Désignation des travaux spécifique
              </label>
              <input
                type="text"
                name="designation_travaux_multi"
                value={formData.designation_travaux_multi}
                onChange={handleChange}
                placeholder="Entrez la désignation spécifique"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                N° Plan de prévention
              </label>
              <input
                type="text"
                name="pdp_multi"
                value={formData.pdp_multi}
                onChange={handleChange}
                placeholder="Entrez le numéro du pdp"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Numéro de cadenas
              </label>
              <input
                type="text"
                name="cadenas_num_multi"
                value={formData.cadenas_num_multi}
                onChange={handleChange}
                placeholder="Entrez le numéro de cadenas"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-500"
              >
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddMultiConsignation;
