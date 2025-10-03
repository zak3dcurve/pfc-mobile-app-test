import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/utils/auth-context";
import CreatableSelect from "react-select/creatable";
import SignaturePad from "signature_pad";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  LockClosedIcon,
  InformationCircleIcon,
  PencilIcon,
  CogIcon
} from "@heroicons/react/24/outline";

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
  const isMobile = useIsMobile();

  // Parent (common) consignation info
  const [parentConsignation, setParentConsignation] = useState(null);
  const [loadingParent, setLoadingParent] = useState(true);

  // Options for the entreprise and its persons (for the new demandeur)
  const [entreprises, setEntreprises] = useState([]);
  const [demandeursOptions, setDemandeursOptions] = useState([]);
  const [zones, setZones] = useState([]);
  const [siteZones, setSiteZones] = useState([]);
  const [sites, setSites] = useState([]);

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
  const [selectedZone, setSelectedZone] = useState(null);

  // Reference for the demandeur signature using SignaturePad
  const sigPadDemandeur = useRef(null);
  const signaturePadDemandeur = useRef(null);

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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: entrepriseData, error: entrepriseError } = await supabase.from("entreprises").select("id, name, persons(id, name)");
      const { data: zoneData, error: zoneError } = await supabase.from("zones").select("id, name");
      const { data: siteData, error: siteError } = await supabase.from("sites").select("id, name, zones(id, name)");

      if (entrepriseError) {
        console.error("Erreur lors de la récupération des entreprises :", entrepriseError);
      } else {
        // Map to option format for CreatableSelect
        const options = (entrepriseData || []).map((ent) => ({
          value: ent.id,
          label: ent.name,
          persons: ent.persons, // save persons to update demandeurs options later
        }));
        setEntreprises(options);
      }

      if (!zoneError) {
        setZones((zoneData || []).map((zone) => ({ value: zone.id, label: zone.name })));
      }

      if (!siteError) {
        setSites((siteData || []).map((site) => ({ value: site.id, label: site.name, zones: site.zones })));
      }
    };
    fetchData();
  }, []);

  // Update site zones when parent consignation is loaded
  useEffect(() => {
    if (parentConsignation && parentConsignation.site_id && sites.length > 0) {
      const foundSite = sites.find((site) => site.value === parentConsignation.site_id);
      if (foundSite && foundSite.zones) {
        setSiteZones(foundSite.zones.map((z) => ({ value: z.id, label: z.name })));
      }
    }
  }, [parentConsignation, sites]);

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

  // Setup signature pad with responsive sizing
// Replace your setupSignaturePad and useEffect with this improved version:

const setupSignaturePad = (canvasRef, signaturePadRef) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const container = canvas.parentElement;
  if (!container || container.offsetWidth === 0) {
    console.warn('Container not ready');
    return false; // Return false if setup failed
  }

  const containerWidth = container.offsetWidth;
  const canvasHeight = isMobile ? 120 : 160;
  const ratio = window.devicePixelRatio || 1;

  // Set display size
  canvas.style.width = `${containerWidth - 4}px`;
  canvas.style.height = `${canvasHeight}px`;

  // Set actual size in memory (scaled for retina)
  canvas.width = (containerWidth - 4) * ratio;
  canvas.height = canvasHeight * ratio;

  // Scale canvas context for retina displays
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);

  // Clear any existing signature pad
  if (signaturePadRef.current) {
    signaturePadRef.current.off();
  }

  signaturePadRef.current = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    velocityFilterWeight: 0.7,
    minWidth: isMobile ? 1 : 0.5,
    maxWidth: isMobile ? 3 : 2.5,
    penColor: 'black',
  });
  
  return true; // Return true if setup succeeded
};

// Improved initialization with retry mechanism
useEffect(() => {
  let mounted = true;
  let retryCount = 0;
  const maxRetries = 5;

  const initializeSignaturePad = () => {
    if (!mounted || !sigPadDemandeur.current) return;

    const success = setupSignaturePad(sigPadDemandeur, signaturePadDemandeur);
    
    if (!success && retryCount < maxRetries) {
      retryCount++;
      setTimeout(initializeSignaturePad, 100 * retryCount); // Exponential backoff
    }
  };

  // Initial delay to ensure DOM is ready
  const timer = setTimeout(initializeSignaturePad, 100);

  const handleResize = () => {
    if (sigPadDemandeur.current && signaturePadDemandeur.current) {
      const wasEmpty = signaturePadDemandeur.current.isEmpty();
      const signatureData = wasEmpty ? [] : signaturePadDemandeur.current.toData();
      
      setupSignaturePad(sigPadDemandeur, signaturePadDemandeur);
      
      if (!wasEmpty && signatureData.length > 0) {
        signaturePadDemandeur.current.fromData(signatureData);
      }
    }
  };

  window.addEventListener('resize', handleResize);
  
  return () => {
    mounted = false;
    clearTimeout(timer);
    window.removeEventListener('resize', handleResize);
    if (signaturePadDemandeur.current) {
      signaturePadDemandeur.current.off();
    }
  };
}, [isMobile, parentConsignation]); // Added parentConsignation as dependency

  // Clear the signature using SignaturePad's clear method
  const clearSignature = () => {
    if (signaturePadDemandeur.current) {
      signaturePadDemandeur.current.clear();
    }
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
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
    if (!signaturePadDemandeur.current || signaturePadDemandeur.current.isEmpty()) {
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



    // Handle zone creation if new
    let finalZone = selectedZone;
    if (selectedZone && selectedZone.__isNew__) {
      const { data, error } = await supabase
        .from("zones")
        .insert({ name: selectedZone.label, site_id: parentConsignation.site_id })
        .select();
      if (error) {
        console.error("Erreur lors de l'insertion de la nouvelle zone :", error);
        alert("Une erreur est survenue lors de la création de la zone.");
        return;
      }
      finalZone = { value: Number(data[0].id), label: data[0].name };
    }

    // Build payload: inherit parent's common data and add new unique data
    const payload = {
      site_id: parentConsignation.site_id,
      entreprise_utilisatrice_id:parentConsignation.entreprise_utilisatrice?.id || null,
      signature_consignateur: parentConsignation.signature_consignateur,
      multi_consignation_id: Number(parentId), // Link this new record to the parent
      date_consignation: parentConsignation.date_consignation,
      zone_id: finalZone ? Number(finalZone.value) : parentConsignation.zone_id, // Use selected zone or parent zone
      consignateur_id: parentConsignation.consignateur_id,
      entreprise_id:  Number(entrepriseId),
      // Unique fields for the multi‑consignation:
      designation_travaux: formData.designation_travaux_multi,
      pdp: formData.pdp_multi,
      cadenas_num: formData.cadenas_num_multi,
      equipements: parentConsignation.equipements, // Use parent equipements
      lockbox: parentConsignation.lockbox,
      // New demandeur and signature
      demandeur_id: Number(demandeurId),
      signature_demandeur: signaturePadDemandeur.current.toDataURL(),
      // Audit and status fields:
      status: parentConsignation.status,
      created_by: user.id,
      updated_by: user.id,
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
    <div className="min-h-screen bg-gray-50 p-4 pt-20">
      <div className={`max-w-4xl mx-auto space-y-6 ${
        isMobile ? 'px-2' : 'px-4'
      }`}>
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
              Ajouter une consignation multiple
            </CardTitle>
          </CardHeader>
          <CardContent>

            {/* Display Parent Consignation (common fields) */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-blue-900">Informations communes (parent)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                    <CalendarIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">Date de consignation</p>
                    <p className="text-sm text-gray-700 font-mono">{formatDateTime(parentConsignation.date_consignation)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                    <MapPinIcon className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">Zone</p>
                    <p className="text-sm text-gray-700">{parentConsignation.zones?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                    <UserIcon className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">Consignateur</p>
                    <p className="text-sm text-gray-700">{parentConsignation.consignateur?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                    <LockClosedIcon className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">N° LockBox</p>
                    <p className="text-sm text-gray-700 font-mono">{parentConsignation.lockbox || "Non défini"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                    <CogIcon className="h-3 w-3 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">Équipements</p>
                    <p className="text-sm text-gray-700">{parentConsignation.equipements || "Non défini"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* New Multi‑Consignation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Entreprise Selection (for new demandeur) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-900">
                    Entreprise extérieure
                  </label>
                </div>
                <CreatableSelect
                  options={entreprises}
                  value={selectedEntreprise}
                  onChange={(value) => setSelectedEntreprise(value)}
                  placeholder="Sélectionnez ou créez une entreprise..."
                />
              </div>

              {/* 2. Demandeur (dependent on selected entreprise) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <UserIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-900">
                    Demandeur (nouveau)
                  </label>
                </div>
                <CreatableSelect
                  options={demandeursOptions}
                  value={selectedDemandeur}
                  onChange={(value) => setSelectedDemandeur(value)}
                  placeholder="Sélectionnez ou créez un demandeur..."
                />
              </div>

              {/* 3. Zone Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <MapPinIcon className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-900">
                    Zone spécifique (optionnel)
                  </label>
                </div>
                <CreatableSelect
                  options={siteZones}
                  value={selectedZone}
                  onChange={(value) => setSelectedZone(value)}
                  placeholder="Sélectionnez ou créez une zone spécifique..."
                  isClearable
                />
              </div>

              {/* 4. Signature du Demandeur */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                    <PencilIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-900">
                    Signature du demandeur
                  </label>
                </div>
                <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white relative" style={{ minHeight: isMobile ? '120px' : '160px' }}>
  <canvas
    ref={sigPadDemandeur}
    className="w-full bg-white"
  ></canvas>
</div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className={`rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Effacer la signature
                </button>
              </div>

              <Separator className="my-6" />

              {/* 5. Champs spécifiques (non‑communs) */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Détails spécifiques</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      <WrenchScrewdriverIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    <label className="text-sm font-medium text-gray-900">
                      Désignation des travaux spécifique
                    </label>
                  </div>
                  <input
                    type="text"
                    name="designation_travaux_multi"
                    value={formData.designation_travaux_multi}
                    onChange={handleChange}
                    placeholder="Entrez la désignation spécifique"
                    className={`block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isMobile ? 'h-12' : ''
                    }`}
                  />
                </div>


                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                      <WrenchScrewdriverIcon className="h-4 w-4 text-yellow-600" />
                    </div>
                    <label className="text-sm font-medium text-gray-900">
                      N° Plan de prévention
                    </label>
                  </div>
                  <input
                    type="text"
                    name="pdp_multi"
                    value={formData.pdp_multi}
                    onChange={handleChange}
                    placeholder="Entrez le numéro du pdp"
                    className={`block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isMobile ? 'h-12' : ''
                    }`}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                      <LockClosedIcon className="h-4 w-4 text-yellow-600" />
                    </div>
                    <label className="text-sm font-medium text-gray-900">
                      Numéro de cadenas
                    </label>
                  </div>
                  <input
                    type="text"
                    name="cadenas_num_multi"
                    value={formData.cadenas_num_multi}
                    onChange={handleChange}
                    placeholder="Entrez le numéro de cadenas"
                    className={`block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isMobile ? 'h-12' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Separator className="my-6" />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Envoyer la consignation
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMultiConsignation;
