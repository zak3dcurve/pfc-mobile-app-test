import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import SignaturePad from "signature_pad";
import { supabase } from "@/features/auth/utils/supabase-client";

const ContinueConsignation = () => {
  const { id } = useParams(); // Consignation id from URL
  const navigate = useNavigate();

  // Step state: we start at step 3 (demandeur details)
  const [currentStep, setCurrentStep] = useState(3);
  // formData holds fields for step 4 (date, etc.)
  const [formData, setFormData] = useState({
    date_consignation: "", // will be set from the record or default
    signature_demandeur: "",
    signature_attestation: "",
  });
  // Error state
  const [errors, setErrors] = useState({});

  // Selected entreprise (from the consignation record) and demandeur (to be selected)
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [selectedDemandeur, setSelectedDemandeur] = useState(null);
  // List of demandeur options
  const [demandeurs, setDemandeurs] = useState([]);

  // Refs for signature pads
  const sigPadDemandeur = useRef(null);
  const signaturePadDemandeur = useRef(null);
  const sigPadAttestation = useRef(null);
  const signaturePadAttestation = useRef(null);

  // Helper function to get a formatted local date
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

  // Fetch the consignation record using the id and preload entreprise and date
  useEffect(() => {
    const fetchConsignation = async () => {
      const { data, error } = await supabase
        .from("consignations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching consignation:", error);
      } else {
        // Set the date_consignation field (if not provided, use current date)
        setFormData((prev) => ({
          ...prev,
          date_consignation: data.date_consignation || getFormattedLocal(),
        }));
        // Fetch the entreprise details using the entreprise_id from the record
        const { data: entrepriseData, error: errEntreprise } = await supabase
          .from("entreprises")
          .select("id, name")
          .eq("id", data.entreprise_id)
          .single();
        if (errEntreprise) {
          console.error("Error fetching entreprise:", errEntreprise);
        } else {
          setSelectedEntreprise({ value: entrepriseData.id, label: entrepriseData.name });
        }
      }
    };
    fetchConsignation();
  }, [id]);

  // Fetch the list of demandeurs (persons) for selection
  useEffect(() => {
    const fetchDemandeurs = async () => {
      const { data, error } = await supabase.from("persons").select("id, name");
      if (error) {
        console.error("Error fetching demandeurs:", error);
      } else {
        const options = data.map((person) => ({ value: person.id, label: person.name }));
        setDemandeurs(options);
      }
    };
    fetchDemandeurs();
  }, []);

  // Initialize the demandeur signature pad when on step 3
  useEffect(() => {
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
  }, [currentStep]);

  // Initialize the attestation signature pad when on step 4
  useEffect(() => {
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

  const clearDemandeurSignature = () => {
    if (signaturePadDemandeur.current) {
      signaturePadDemandeur.current.clear();
    }
  };

  const clearAttestationSignature = () => {
    if (signaturePadAttestation.current) {
      signaturePadAttestation.current.clear();
    }
  };

  // Validation for Step 3: demandeur selection and demandeur signature
  const validateStep3 = () => {
    const newErrors = {};
    if (!selectedDemandeur) {
      newErrors.demandeur = "Le demandeur est requis.";
    }
    if (!signaturePadDemandeur.current || signaturePadDemandeur.current.isEmpty()) {
      newErrors.signature_demandeur = "La signature du demandeur est requise.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 4: date and attestation signature
  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.date_consignation) {
      newErrors.date_consignation = "La date de consignation est requise.";
    }
    if (!signaturePadAttestation.current || signaturePadAttestation.current.isEmpty()) {
      newErrors.signature_attestation = "La signature d'attestation est requise.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 3) {
      if (validateStep3()) {
        setErrors({});
        setCurrentStep(4);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 4) {
      setErrors({});
      setCurrentStep(3);
    }
  };

  // Final submission: update the consignation with demandeur details, both signatures, and set status to "pending"
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep4()) {
      return;
    }
    const updatedData = {
      demandeur_id: selectedDemandeur ? Number(selectedDemandeur.value) : null,
      signature_demandeur: signaturePadDemandeur.current.toDataURL(),
      signature_attestation: signaturePadAttestation.current.toDataURL(),
      date_consignation: formData.date_consignation,
      status: "pending",
    };
    const { data, error } = await supabase
      .from("consignations")
      .update(updatedData)
      .eq("id", id);
    if (error) {
      console.error("Error updating consignation:", error);
      alert("Erreur lors de la mise à jour de la consignation.");
    } else {
      console.log("Consignation updated successfully:", data);
      navigate("/consignationlist");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-12 bg-white p-6 shadow-md rounded-lg">
        {currentStep === 3 && (
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold text-gray-900">Étape 3 : Détails du Demandeur</h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Display the entreprise (from consignation) – not editable */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Entreprise</label>
                <CreatableSelect value={selectedEntreprise} isDisabled placeholder="Entreprise" />
              </div>
              {/* Demandeur selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Demandeur</label>
                <CreatableSelect
                  value={selectedDemandeur}
                  onChange={(value) => setSelectedDemandeur(value)}
                  options={demandeurs}
                  placeholder="Sélectionnez ou créez un demandeur..."
                />
                {errors.demandeur && <p className="mt-2 text-sm text-red-600">{errors.demandeur}</p>}
              </div>
              {/* Demandeur signature */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Signature du Demandeur</label>
                <canvas ref={sigPadDemandeur} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                <button
                  type="button"
                  onClick={clearDemandeurSignature}
                  className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Effacer la signature
                </button>
                {errors.signature_demandeur && (
                  <p className="mt-2 text-sm text-red-600">{errors.signature_demandeur}</p>
                )}
              </div>
              {/* Navigation: move to step 4 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold text-gray-900">Étape finale</h2>
            <p className="mt-1 text-sm text-gray-600">
              Fournissez la signature d'attestation et vérifiez les détails.
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
                  className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 
                             outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                />
                {errors.date_consignation && (
                  <p className="mt-2 text-sm text-red-600">{errors.date_consignation}</p>
                )}
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
              {/* Attestation signature */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-900">Signature d'attestation</label>
                <canvas ref={sigPadAttestation} className="mt-2 border rounded w-80 h-40 mx-auto"></canvas>
                <button
                  type="button"
                  onClick={clearAttestationSignature}
                  className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Effacer la signature
                </button>
                {errors.signature_attestation && (
                  <p className="mt-2 text-sm text-red-600">{errors.signature_attestation}</p>
                )}
              </div>
            </div>
            {/* Navigation buttons for step 4 */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900"
              >
                Précédent
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ContinueConsignation;
