import { useRef, useState, useEffect } from "react";
import { z } from "zod";
import SignaturePad from "signature_pad";
import { supabase } from "@/features/auth/utils/supabase-client";
import Navbar from "@/components/app-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── ZOD SCHEMAS ────────────────────────────────────────────────────────────────

// For step 1: basic text inputs and selects
const step1Schema = z.object({
  site_id: z.string().nonempty({ message: "Site is required" }),
  zone_id: z.string().nonempty({ message: "Zone is required" }),
  designation_travaux: z.string().nonempty({ message: "Designation is required" }),
  equipements: z.string().nonempty({ message: "Equipements is required" }),
  cadenas_num: z.string().nonempty({ message: "Cadenas number is required" }),
});

// For step 2: consignateur select (the signature is validated separately)
const step2Schema = z.object({
  consignateur_id: z.string().nonempty({ message: "Consignateur is required" }),
});

// For step 3: demandeur and entreprise selects
const step3Schema = z.object({
  demandeur_id: z.string().nonempty({ message: "Demandeur is required" }),
  entreprise_id: z.string().nonempty({ message: "Entreprise is required" }),
});

const ConsignationForm = () => {
  const [formData, setFormData] = useState({
    site_id: "",
    zone_id: "",
    designation_travaux: "",
    equipements: "",
    cadenas_num: "",
    type_consignation: ["electrique"],
    consignateur_id: "",
    signature_consignateur: "",
    consigne_pour_moi: false,
    info_salle_controle: false,
    demandeur_id: "",
    signature_demandeur: "",
    entreprise_id: "",
    status: "pending",
    created_by: "6500088b-bace-48e4-b023-4977849c5def",
    updated_by: "6500088b-bace-48e4-b023-4977849c5def",
  });

  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [consignateurs, setConsignateurs] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  // errors is an object mapping field names to an array of error messages
  const [errors, setErrors] = useState({});

  // Refs for the signature canvases
  const sigPadConsignateur = useRef(null);
  const sigPadDemandeur = useRef(null);
  const signaturePadConsignateur = useRef(null);
  const signaturePadDemandeur = useRef(null);

  // ─── FETCH DATA ON MOUNT ─────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      const { data: siteData } = await supabase.from("sites").select("id, name");
      const { data: zoneData } = await supabase.from("zones").select("id, name");
      const { data: consignateurData } = await supabase.from("persons").select("id, name");
      const { data: demandeurData } = await supabase.from("persons").select("id, name");
      const { data: entrepriseData } = await supabase.from("entreprises").select("id, name");

      setSites(siteData || []);
      setZones(zoneData || []);
      setConsignateurs(consignateurData || []);
      setDemandeurs(demandeurData || []);
      setEntreprises(entrepriseData || []);
    };
    fetchData();
  }, []);

  // ─── INIT SIGNATURE PADS ────────────────────────────────────────────────
  useEffect(() => {
    const canvasCons = sigPadConsignateur.current;
    const canvasDem = sigPadDemandeur.current;
    signaturePadConsignateur.current = new SignaturePad(canvasCons);
    signaturePadDemandeur.current = new SignaturePad(canvasDem);

    return () => {
      signaturePadConsignateur.current.off();
      signaturePadDemandeur.current.off();
    };
  }, []);

  // ─── HANDLERS ───────────────────────────────────────────────────────────────

  // Standard change handler for text inputs/checkboxes.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newVal,
    }));
  };

  // Validate one field using the appropriate schema for the current step.
  // We use Zod's `pick` method so we validate just that one field.
  const validateField = (field, value) => {
    let schema;
    if (currentStep === 1 && step1Schema.shape[field]) {
      schema = step1Schema.pick({ [field]: true });
    } else if (currentStep === 2 && step2Schema.shape[field]) {
      schema = step2Schema.pick({ [field]: true });
    } else if (currentStep === 3 && step3Schema.shape[field]) {
      schema = step3Schema.pick({ [field]: true });
    }
    if (schema) {
      const result = schema.safeParse({ [field]: value });
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (!result.success) {
          newErrors[field] = result.error.flatten().fieldErrors[field];
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  // Validate an entire step when clicking "Next"
  const validateStep = (step) => {
    let result;
    let newErrors = {};
    if (step === 1) {
      result = step1Schema.safeParse(formData);
      if (!result.success) {
        newErrors = result.error.flatten().fieldErrors;
      }
    } else if (step === 2) {
      result = step2Schema.safeParse(formData);
      if (!result.success) {
        newErrors = result.error.flatten().fieldErrors;
      }
      if (signaturePadConsignateur.current.isEmpty()) {
        newErrors.signature_consignateur = ["Signature is required"];
      }
    } else if (step === 3) {
      result = step3Schema.safeParse(formData);
      if (!result.success) {
        newErrors = result.error.flatten().fieldErrors;
      }
    } else if (step === 4) {
      if (signaturePadDemandeur.current.isEmpty()) {
        newErrors.signature_demandeur = ["Signature is required"];
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Final submit handler.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final check for demandeur signature
    if (signaturePadDemandeur.current.isEmpty()) {
      setErrors((prev) => ({
        ...prev,
        signature_demandeur: ["Signature is required"],
      }));
      return;
    }
    const signatureCons = sigPadConsignateur.current.toDataURL();
    const signatureDem = sigPadDemandeur.current.toDataURL();

    const updatedFormData = {
      ...formData,
      signature_consignateur: signatureCons,
      signature_demandeur: signatureDem,
    };

    const { error } = await supabase.from("consignations").insert([updatedFormData]);
    if (error) {
      console.error("Error inserting:", error);
    } else {
      console.log("Inserted successfully!");
    }
  };

  const clearSignatureConsignateur = () => {
    signaturePadConsignateur.current.clear();
  };

  const clearSignatureDemandeur = () => {
    signaturePadDemandeur.current.clear();
  };

  // ─── THE FORM ──────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded-lg shadow-md max-w-4xl mx-auto mt-20 bg-white"
      >
        {currentStep === 1 && (
          <>
            {/* --- Site --- */}
            <div className="mb-4">
              <Label>Site:</Label>
              <Select
                name="site_id"
                value={formData.site_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, site_id: value }));
                  validateField("site_id", value);
                }}
              >
                <SelectTrigger>
                  {/* Note: Do not pass children to SelectValue so it displays the selected option automatically */}
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && (
                <span className="text-red-500">{errors.site_id.join(", ")}</span>
              )}
            </div>

            {/* --- Zone --- */}
            <div className="mb-4">
              <Label>Zone:</Label>
              <Select
                name="zone_id"
                value={formData.zone_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, zone_id: value }));
                  validateField("zone_id", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone_id && (
                <span className="text-red-500">{errors.zone_id.join(", ")}</span>
              )}
            </div>

            {/* --- Désignation des Travaux --- */}
            <div className="mb-4">
              <Label>Désignation des Travaux:</Label>
              <Input
                type="text"
                name="designation_travaux"
                value={formData.designation_travaux}
                onChange={handleChange}
                onBlur={() =>
                  validateField("designation_travaux", formData.designation_travaux)
                }
              />
              {errors.designation_travaux && (
                <span className="text-red-500">
                  {errors.designation_travaux.join(", ")}
                </span>
              )}
            </div>

            {/* --- Équipements --- */}
            <div className="mb-4">
              <Label>Équipements:</Label>
              <Input
                type="text"
                name="equipements"
                value={formData.equipements}
                onChange={handleChange}
                onBlur={() => validateField("equipements", formData.equipements)}
              />
              {errors.equipements && (
                <span className="text-red-500">
                  {errors.equipements.join(", ")}
                </span>
              )}
            </div>

            {/* --- N° des Cadenas --- */}
            <div className="mb-4">
              <Label>N° des Cadenas:</Label>
              <Input
                type="text"
                name="cadenas_num"
                value={formData.cadenas_num}
                onChange={handleChange}
                onBlur={() => validateField("cadenas_num", formData.cadenas_num)}
              />
              {errors.cadenas_num && (
                <span className="text-red-500">
                  {errors.cadenas_num.join(", ")}
                </span>
              )}
            </div>

            <Button type="button" onClick={handleNextStep} className="mt-4">
              Next
            </Button>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* --- Consignateur --- */}
            <div className="mb-4">
              <Label>Consignateur:</Label>
              <Select
                name="consignateur_id"
                value={formData.consignateur_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, consignateur_id: value }));
                  validateField("consignateur_id", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Consignateur" />
                </SelectTrigger>
                <SelectContent>
                  {consignateurs.map((cons) => (
                    <SelectItem key={cons.id} value={cons.id}>
                      {cons.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consignateur_id && (
                <span className="text-red-500">
                  {errors.consignateur_id.join(", ")}
                </span>
              )}
            </div>

            {/* --- Signature Consignateur --- */}
            <div className="mb-4">
              <Label>Signature Consignateur:</Label>
              <canvas
                ref={sigPadConsignateur}
                className="border rounded w-full h-40"
              ></canvas>
              <Button type="button" onClick={clearSignatureConsignateur} className="mt-2">
                Clear Signature
              </Button>
              {errors.signature_consignateur && (
                <span className="text-red-500">
                  {errors.signature_consignateur.join(", ")}
                </span>
              )}
            </div>

            {/* --- Checkboxes --- */}
            <div className="mb-4">
              <Label>
                <input
                  type="checkbox"
                  name="consigne_pour_moi"
                  checked={formData.consigne_pour_moi}
                  onChange={handleChange}
                />
                &nbsp; Consigné pour moi-même
              </Label>
            </div>
            <div className="mb-4">
              <Label>
                <input
                  type="checkbox"
                  name="info_salle_controle"
                  checked={formData.info_salle_controle}
                  onChange={handleChange}
                />
                &nbsp; Informé la salle de contrôle
              </Label>
            </div>

            <Button type="button" onClick={handlePreviousStep} className="mt-4 mr-2">
              Previous
            </Button>
            <Button type="button" onClick={handleNextStep} className="mt-4">
              Next
            </Button>
          </>
        )}

        {currentStep === 3 && (
          <>
            {/* --- Demandeur --- */}
            <div className="mb-4">
              <Label>Demandeur:</Label>
              <Select
                name="demandeur_id"
                value={formData.demandeur_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, demandeur_id: value }));
                  validateField("demandeur_id", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Demandeur" />
                </SelectTrigger>
                <SelectContent>
                  {demandeurs.map((dem) => (
                    <SelectItem key={dem.id} value={dem.id}>
                      {dem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.demandeur_id && (
                <span className="text-red-500">
                  {errors.demandeur_id.join(", ")}
                </span>
              )}
            </div>

            {/* --- Entreprise --- */}
            <div className="mb-4">
              <Label>Entreprise:</Label>
              <Select
                name="entreprise_id"
                value={formData.entreprise_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, entreprise_id: value }));
                  validateField("entreprise_id", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {entreprises.map((ent) => (
                    <SelectItem key={ent.id} value={ent.id}>
                      {ent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entreprise_id && (
                <span className="text-red-500">
                  {errors.entreprise_id.join(", ")}
                </span>
              )}
            </div>

            <Button type="button" onClick={handlePreviousStep} className="mt-4 mr-2">
              Previous
            </Button>
            <Button type="button" onClick={handleNextStep} className="mt-4">
              Next
            </Button>
          </>
        )}

        {currentStep === 4 && (
          <>
            {/* --- Signature Demandeur --- */}
            <div className="mb-4">
              <Label>Signature Demandeur:</Label>
              <canvas
                ref={sigPadDemandeur}
                className="border rounded w-full h-40"
              ></canvas>
              <Button type="button" onClick={clearSignatureDemandeur} className="mt-2">
                Clear Signature
              </Button>
              {errors.signature_demandeur && (
                <span className="text-red-500">
                  {errors.signature_demandeur.join(", ")}
                </span>
              )}
            </div>

            {/* --- Status and Declaration --- */}
            <div className="mb-4">
              <Label>Status:</Label>
              <Input type="text" name="status" value="pending" readOnly />
            </div>
            <div className="mb-4">
              <Label>
                Je soussigné M. :{" "}
                {formData.demandeur_id
                  ? demandeurs.find((d) => d.id === formData.demandeur_id)?.name
                  : "N/A"}{" "}
                de l'entreprise{" "}
                {formData.entreprise_id
                  ? entreprises.find((e) => e.id === formData.entreprise_id)?.name
                  : "N/A"}{" "}
                chargé des travaux ci-dessus désignés, déclare avoir reçu le présent
                avis de consignation et pris connaissance des prescriptions de sécurité.
              </Label>
            </div>

            <Button type="button" onClick={handlePreviousStep} className="mt-4 mr-2">
              Previous
            </Button>
            <Button type="submit" className="mt-4">
              Submit
            </Button>
          </>
        )}
      </form>
    </>
  );
};

export default ConsignationForm;
