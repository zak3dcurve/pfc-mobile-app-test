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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // errors is an object mapping field names to an array of error messages
  const [errors, setErrors] = useState({});

  // Refs for the signature canvases
  const sigPadConsignateur = useRef(null);
  const sigPadDemandeur = useRef(null);
  const signaturePadConsignateur = useRef(null);
  const signaturePadDemandeur = useRef(null);
  const formRef = useRef(null);

  // Mobile keyboard handling
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyboardShow = () => {
      // Adjust viewport when keyboard shows on mobile
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    };

    const handleKeyboardHide = () => {
      document.documentElement.style.setProperty('--viewport-height', '100vh');
    };

    window.addEventListener('resize', handleKeyboardShow);
    window.addEventListener('orientationchange', handleKeyboardHide);

    return () => {
      window.removeEventListener('resize', handleKeyboardShow);
      window.removeEventListener('orientationchange', handleKeyboardHide);
    };
  }, [isMobile]);

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
    const initSignaturePads = () => {
      const canvasCons = sigPadConsignateur.current;
      const canvasDem = sigPadDemandeur.current;

      if (canvasCons && canvasDem) {
        // Set canvas dimensions based on container
        const setCanvasSize = (canvas) => {
          const container = canvas.parentElement;
          const containerWidth = container.offsetWidth;
          const canvasHeight = isMobile ? 120 : 160;

          canvas.width = containerWidth - 2; // Account for border
          canvas.height = canvasHeight;

          // Set CSS dimensions to match
          canvas.style.width = `${containerWidth - 2}px`;
          canvas.style.height = `${canvasHeight}px`;
        };

        setCanvasSize(canvasCons);
        setCanvasSize(canvasDem);

        signaturePadConsignateur.current = new SignaturePad(canvasCons, {
          backgroundColor: 'rgba(255,255,255,0)',
          penColor: 'rgb(0, 0, 0)',
          velocityFilterWeight: 0.7,
          minWidth: isMobile ? 1 : 0.5,
          maxWidth: isMobile ? 3 : 2.5,
        });
        signaturePadDemandeur.current = new SignaturePad(canvasDem, {
          backgroundColor: 'rgba(255,255,255,0)',
          penColor: 'rgb(0, 0, 0)',
          velocityFilterWeight: 0.7,
          minWidth: isMobile ? 1 : 0.5,
          maxWidth: isMobile ? 3 : 2.5,
        });
      }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(initSignaturePads, 100);

    // Handle window resize
    const handleResize = () => {
      if (signaturePadConsignateur.current && signaturePadDemandeur.current) {
        initSignaturePads();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (signaturePadConsignateur.current) signaturePadConsignateur.current.off();
      if (signaturePadDemandeur.current) signaturePadDemandeur.current.off();
    };
  }, [isMobile]);

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
      setIsTransitioning(true);
      // Scroll to top for mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handlePreviousStep = () => {
    setIsTransitioning(true);
    // Scroll to top for mobile
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsTransitioning(false);
    }, 200);
  };

  // Final submit handler.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Final check for demandeur signature
    if (signaturePadDemandeur.current.isEmpty()) {
      setErrors((prev) => ({
        ...prev,
        signature_demandeur: ["Signature is required"],
      }));
      setIsSubmitting(false);
      return;
    }

    try {
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
        // Add error feedback for user
        setErrors({ submit: ["Erreur lors de la soumission. Veuillez réessayer."] });
      } else {
        console.log("Inserted successfully!");
        // Add success feedback
        if (isMobile && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Success haptic feedback
        }
        // You could redirect here or show success message
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrors({ submit: ["Erreur lors de la soumission. Veuillez réessayer."] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignatureConsignateur = () => {
    signaturePadConsignateur.current.clear();
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const clearSignatureDemandeur = () => {
    signaturePadDemandeur.current.clear();
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Add swipe gesture support for mobile
  useEffect(() => {
    if (!isMobile || !formRef.current) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Check if horizontal swipe is more than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && currentStep < 4) {
          // Swipe left - next step
          handleNextStep();
        } else if (diffX < 0 && currentStep > 1) {
          // Swipe right - previous step
          handlePreviousStep();
        }
      }

      startX = 0;
      startY = 0;
    };

    const formElement = formRef.current;
    formElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    formElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (formElement) {
        formElement.removeEventListener('touchstart', handleTouchStart);
        formElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isMobile, currentStep]);

  // ─── THE FORM ──────────────────────────────────────────────────────────────
  const steps = [
    { id: 1, name: 'Informations', description: 'Site et équipements' },
    { id: 2, name: 'Consignateur', description: 'Signature et options' },
    { id: 3, name: 'Demandeur', description: 'Entreprise et contact' },
    { id: 4, name: 'Finalisation', description: 'Signature finale' }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 sm:bg-white">
        {/* Mobile Progress Bar */}
        <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-40">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900">Nouvelle Consignation</h1>
            <span className="text-sm text-gray-500">{currentStep}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{steps[currentStep - 1]?.description}</p>
        </div>

        {/* Desktop Progress Steps */}
        <div className="hidden sm:block bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div className={`flex items-center ${index !== steps.length - 1 ? 'pr-8' : ''}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.id < currentStep ? 'bg-blue-600 text-white' :
                      step.id === currentStep ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {step.id < currentStep ? (
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index !== steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 md:p-8 border-0 sm:border rounded-none sm:rounded-lg shadow-none sm:shadow-md max-w-4xl mx-auto mt-0 sm:mt-8 bg-white relative"
          >
            {/* Loading overlay for mobile */}
            {(isTransitioning || isSubmitting) && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-none sm:rounded-lg">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">
                    {isSubmitting ? 'Soumission en cours...' : 'Chargement...'}
                  </p>
                </div>
              </div>
            )}
        {currentStep === 1 && (
          <div className="form-step">
            {/* --- Site --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Site:</Label>
              <Select
                name="site_id"
                value={formData.site_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, site_id: value }));
                  validateField("site_id", value);
                }}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id} className="text-base sm:text-sm py-3 sm:py-2">
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && (
                <span className="text-red-500 text-sm mt-1 block">{errors.site_id.join(", ")}</span>
              )}
            </div>

            {/* --- Zone --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Zone:</Label>
              <Select
                name="zone_id"
                value={formData.zone_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, zone_id: value }));
                  validateField("zone_id", value);
                }}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id} className="text-base sm:text-sm py-3 sm:py-2">
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone_id && (
                <span className="text-red-500 text-sm mt-1 block">{errors.zone_id.join(", ")}</span>
              )}
            </div>

            {/* --- Désignation des Travaux --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Désignation des Travaux:</Label>
              <Input
                type="text"
                name="designation_travaux"
                value={formData.designation_travaux}
                onChange={handleChange}
                onBlur={() =>
                  validateField("designation_travaux", formData.designation_travaux)
                }
                className="h-12 sm:h-10 text-base sm:text-sm px-4"
                placeholder="Entrez la désignation des travaux"
              />
              {errors.designation_travaux && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.designation_travaux.join(", ")}
                </span>
              )}
            </div>

            {/* --- Équipements --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Équipements:</Label>
              <Input
                type="text"
                name="equipements"
                value={formData.equipements}
                onChange={handleChange}
                onBlur={() => validateField("equipements", formData.equipements)}
                className="h-12 sm:h-10 text-base sm:text-sm px-4"
                placeholder="Entrez les équipements"
              />
              {errors.equipements && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.equipements.join(", ")}
                </span>
              )}
            </div>

            {/* --- N° des Cadenas --- */}
            <div className="mb-6 sm:mb-8">
              <Label className="text-sm sm:text-base font-medium mb-2 block">N° des Cadenas:</Label>
              <Input
                type="text"
                name="cadenas_num"
                value={formData.cadenas_num}
                onChange={handleChange}
                onBlur={() => validateField("cadenas_num", formData.cadenas_num)}
                className="h-12 sm:h-10 text-base sm:text-sm px-4"
                placeholder="Entrez le numéro des cadenas"
              />
              {errors.cadenas_num && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.cadenas_num.join(", ")}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={handleNextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            {/* --- Consignateur --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Consignateur:</Label>
              <Select
                name="consignateur_id"
                value={formData.consignateur_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, consignateur_id: value }));
                  validateField("consignateur_id", value);
                }}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select Consignateur" />
                </SelectTrigger>
                <SelectContent>
                  {consignateurs.map((cons) => (
                    <SelectItem key={cons.id} value={cons.id} className="text-base sm:text-sm py-3 sm:py-2">
                      {cons.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consignateur_id && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.consignateur_id.join(", ")}
                </span>
              )}
            </div>

            {/* --- Signature Consignateur --- */}
            <div className="mb-6 sm:mb-8">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Signature Consignateur:</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 touch-manipulation">
                <canvas
                  ref={sigPadConsignateur}
                  className="border border-gray-200 rounded w-full bg-white touch-none"
                  style={{ touchAction: 'none' }}
                ></canvas>
              </div>
              <Button
                type="button"
                onClick={clearSignatureConsignateur}
                variant="outline"
                className="mt-3 w-full sm:w-auto h-10 text-sm"
              >
                Clear Signature
              </Button>
              {errors.signature_consignateur && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.signature_consignateur.join(", ")}
                </span>
              )}
            </div>

            {/* --- Checkboxes --- */}
            <div className="space-y-4 mb-6">
              <Label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="consigne_pour_moi"
                  checked={formData.consigne_pour_moi}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm sm:text-base">Consigné pour moi-même</span>
              </Label>
              <Label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="info_salle_controle"
                  checked={formData.info_salle_controle}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm sm:text-base">Informé la salle de contrôle</span>
              </Label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
              <Button type="button" onClick={handlePreviousStep} variant="outline" className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Previous
              </Button>
              <Button type="button" onClick={handleNextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-step">
            {/* --- Demandeur --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Demandeur:</Label>
              <Select
                name="demandeur_id"
                value={formData.demandeur_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, demandeur_id: value }));
                  validateField("demandeur_id", value);
                }}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select Demandeur" />
                </SelectTrigger>
                <SelectContent>
                  {demandeurs.map((dem) => (
                    <SelectItem key={dem.id} value={dem.id} className="text-base sm:text-sm py-3 sm:py-2">
                      {dem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.demandeur_id && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.demandeur_id.join(", ")}
                </span>
              )}
            </div>

            {/* --- Entreprise --- */}
            <div className="mb-6 sm:mb-8">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Entreprise:</Label>
              <Select
                name="entreprise_id"
                value={formData.entreprise_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, entreprise_id: value }));
                  validateField("entreprise_id", value);
                }}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select Entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {entreprises.map((ent) => (
                    <SelectItem key={ent.id} value={ent.id} className="text-base sm:text-sm py-3 sm:py-2">
                      {ent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entreprise_id && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.entreprise_id.join(", ")}
                </span>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
              <Button type="button" onClick={handlePreviousStep} variant="outline" className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Previous
              </Button>
              <Button type="button" onClick={handleNextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="form-step">
            {/* --- Signature Demandeur --- */}
            <div className="mb-6 sm:mb-8">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Signature Demandeur:</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 touch-manipulation">
                <canvas
                  ref={sigPadDemandeur}
                  className="border border-gray-200 rounded w-full bg-white touch-none"
                  style={{ touchAction: 'none' }}
                ></canvas>
              </div>
              <Button
                type="button"
                onClick={clearSignatureDemandeur}
                variant="outline"
                className="mt-3 w-full sm:w-auto h-10 text-sm"
              >
                Clear Signature
              </Button>
              {errors.signature_demandeur && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.signature_demandeur.join(", ")}
                </span>
              )}
            </div>

            {/* --- Status and Declaration --- */}
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Status:</Label>
              <Input type="text" name="status" value="pending" readOnly className="h-12 sm:h-10 text-base sm:text-sm px-4 bg-gray-50" />
            </div>
            <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-sm sm:text-base leading-relaxed block">
                <strong>Déclaration:</strong><br/><br/>
                Je soussigné M. <strong>{formData.demandeur_id
                  ? demandeurs.find((d) => d.id === formData.demandeur_id)?.name
                  : "N/A"}</strong>{" "}
                de l'entreprise <strong>{formData.entreprise_id
                  ? entreprises.find((e) => e.id === formData.entreprise_id)?.name
                  : "N/A"}</strong>{" "}
                chargé des travaux ci-dessus désignés, déclare avoir reçu le présent
                avis de consignation et pris connaissance des prescriptions de sécurité.
              </Label>
            </div>

            {/* Submit Error Display */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-700 text-sm">{errors.submit.join(", ")}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t">
              <Button type="button" onClick={handlePreviousStep} variant="outline" className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8">
                Previous
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-8 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Soumission...</span>
                  </div>
                ) : (
                  'Submit Consignation'
                )}
              </Button>
            </div>
          </div>
        )}
          </form>
        </div>
      </div>
    </>
  );
};

export default ConsignationForm;
