import { useRef, useState, useEffect } from "react";
import { z } from "zod";
import SignaturePad from "signature_pad";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import Select, { components } from "react-select";
import { useAuth } from "@/features/auth/utils/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  KeyIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CogIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  PaperAirplaneIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  IdentificationIcon,
  HandRaisedIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  BoltIcon,
  Bars3BottomLeftIcon,
  BeakerIcon,
  FireIcon
} from "@heroicons/react/24/outline";

// Icons mapping for consignation types
const consignationTypeIcons = {
  1: BoltIcon,           // électrique
  2: BeakerIcon,         // fluide thermique, hydraulique, frigorigène, gaz, produit dangereux
  3: CogIcon,            // machine risque mécanique
};

const consignationTypeColors = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  2: { bg: 'bg-blue-100', text: 'text-blue-600' },
  3: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

// Custom Option component for consignation types with icons
const ConsignationTypeOption = (props) => {
  const { data, isSelected, isFocused } = props;
  const IconComponent = consignationTypeIcons[data.value] || TagIcon;
  const colors = consignationTypeColors[data.value] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3 py-1">
        <div className={`flex items-center justify-center w-8 h-8 ${colors.bg} rounded-full flex-shrink-0`}>
          <IconComponent className={`h-4 w-4 ${colors.text}`} />
        </div>
        <span className={`${isSelected ? 'font-medium' : ''}`}>{data.label}</span>
      </div>
    </components.Option>
  );
};

// Custom MultiValue component to show icons in selected values
const ConsignationTypeMultiValue = (props) => {
  const { data } = props;
  const IconComponent = consignationTypeIcons[data.value] || TagIcon;
  const colors = consignationTypeColors[data.value] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  
  return (
    <components.MultiValue {...props}>
      <div className="flex items-center gap-1.5">
        <div className={`flex items-center justify-center w-5 h-5 ${colors.bg} rounded-full`}>
          <IconComponent className={`h-3 w-3 ${colors.text}`} />
        </div>
        <span>{data.label}</span>
      </div>
    </components.MultiValue>
  );
};

// Helper function to get formatted local datetime
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

// Zod schemas for validation
const step1Schema = z.object({
  designation_travaux: z.string().min(1, "La désignation des travaux est requise"),
  equipements: z.string().optional(),
  cadenas_num: z.string().optional(),
  pdp: z.string().optional(),
  lockbox: z.string().optional(),
});

const step2Schema = z.object({});
const step3Schema = z.object({});

// Button Loading Component matching ConsignationDetails
const ButtonSpinner = ({ children, loading, loadingText, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${props.className} ${loading ? 'cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          {loadingText || "Chargement..."}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Step configuration for progress indicator
const stepConfig = [
  { id: 1, title: "Informations", icon: InformationCircleIcon, color: "blue" },
  { id: 2, title: "Consignateur", icon: UserIcon, color: "green" },
  { id: 3, title: "Demandeur", icon: UserGroupIcon, color: "purple" },
  { id: 4, title: "Confirmation", icon: DocumentCheckIcon, color: "indigo" },
];

const AddConsignation = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, role, site, entreprise } = useAuth();

  // Form data state
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

  // Options arrays from Supabase
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [consignateurs, setConsignateurs] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [types_consignations, setTypes_consignations] = useState([]);
  const [entreprisePersons, setEntreprisePersons] = useState([]);
  const [siteZones, setSiteZones] = useState([]);

  // Selected values states
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedConsignateur, setSelectedConsignateur] = useState(null);
  const [selectedDemandeur, setSelectedDemandeur] = useState(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [selectedEntrepriseUtilisatrice, setSelectedEntrepriseUtilisatrice] = useState(null);
  const [selectedTypesconsignations, setSelectedTypesconsignations] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Signature pad refs
  const sigPadConsignateur = useRef(null);
  const sigPadDemandeur = useRef(null);
  const sigPadAttestation = useRef(null);
  const signaturePadConsignateur = useRef(null);
  const signaturePadDemandeur = useRef(null);
  const signaturePadAttestation = useRef(null);

  // Dialog states
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [datetimeValue, setDatetimeValue] = useState(getFormattedLocal());

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch options from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: siteData } = await supabase.from("sites").select("id, name, zones(id, name)");
      const { data: zoneData } = await supabase.from("zones").select("id, name");
      const { data: consignateurData } = await supabase.from("persons").select("id, name, entreprise_id");
      const { data: demandeurData } = await supabase.from("persons").select("id, name");
      const { data: entrepriseData } = await supabase.from("entreprises").select("id, name, persons(id, name)");
      const { data: types_consignationData } = await supabase.from("types_consignation").select("id, type_name");

      setSites((siteData || []).map((site) => ({ value: site.id, label: site.name, zones: site.zones })));
      setZones((zoneData || []).map((zone) => ({ value: zone.id, label: zone.name })));
      setConsignateurs((consignateurData || []).map((cons) => ({ value: cons.id, label: cons.name, entreprise_id: cons.entreprise_id })));
      setDemandeurs((demandeurData || []).map((dem) => ({ value: dem.id, label: dem.name })));
      setEntreprises((entrepriseData || []).map((ent) => ({ value: ent.id, label: ent.name, persons: ent.persons })));
      setTypes_consignations((types_consignationData || []).map((tyc) => ({ value: tyc.id, label: tyc.type_name })));
    };
    fetchData();
  }, []);

  // Update entreprise persons when entreprise is selected
  useEffect(() => {
    if (selectedEntreprise) {
      const enterprise = entreprises.find((ent) => ent.value === selectedEntreprise.value);
      if (enterprise && enterprise.persons) {
        setEntreprisePersons(enterprise.persons.map((p) => ({ value: p.id, label: p.name })));
      } else {
        setEntreprisePersons([]);
      }
    } else {
      setEntreprisePersons([]);
    }
  }, [selectedEntreprise, entreprises]);

  useEffect(() => {
    if (selectedEntrepriseUtilisatrice) {
      const enterprise = entreprises.find((ent) => ent.value === selectedEntrepriseUtilisatrice.value);
      if (enterprise && enterprise.persons) {
        setEntreprisePersons(enterprise.persons.map((p) => ({ value: p.id, label: p.name })));
      } else {
        setEntreprisePersons([]);
      }
    } else {
      setEntreprisePersons([]);
    }
  }, [selectedEntrepriseUtilisatrice, entreprises]);

  // Auto-select for technicians
  useEffect(() => {
    if (role === "technicien" && entreprise && entreprises.length > 0) {
      const matchingEntreprise = entreprises.find((e) => e.value === entreprise.id);
      if (matchingEntreprise) {
        setSelectedEntrepriseUtilisatrice(matchingEntreprise);
      }
    }
  }, [role, entreprise, entreprises]);

  useEffect(() => {
    if (selectedConsignateur) {
      setSelectedConsignateur(null);
    }
  }, [selectedEntrepriseUtilisatrice]);

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

  useEffect(() => {
    if (formData.consigne_pour_moi && selectedConsignateur && selectedEntrepriseUtilisatrice) {
      setSelectedDemandeur(selectedConsignateur);
      setSelectedEntreprise(selectedEntrepriseUtilisatrice);
    }
  }, [formData.consigne_pour_moi, selectedConsignateur, selectedEntrepriseUtilisatrice]);

  // Setup signature pads
  const setupSignaturePad = (canvasRef, signaturePadRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const canvasHeight = isMobile ? 120 : 160;
    canvas.width = containerWidth - 4;
    canvas.height = canvasHeight;
    canvas.style.width = `${containerWidth - 4}px`;
    canvas.style.height = `${canvasHeight}px`;
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      velocityFilterWeight: 0.7,
      minWidth: isMobile ? 1 : 0.5,
      maxWidth: isMobile ? 3 : 2.5,
      penColor: 'black',
    });
  };

  useEffect(() => {
    if (currentStep === 2 && sigPadConsignateur.current) {
      setupSignaturePad(sigPadConsignateur, signaturePadConsignateur);
    }
    if (currentStep === 3 && sigPadDemandeur.current) {
      setupSignaturePad(sigPadDemandeur, signaturePadDemandeur);
    }
    if (currentStep === 4 && sigPadAttestation.current) {
      setupSignaturePad(sigPadAttestation, signaturePadAttestation);
    }
  }, [currentStep, isMobile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
      if (!formData.info_salle_controle) {
        newErrors.info_salle_controle = ["Informer la salle de contrôle est obligatoire"];
      }
    } else if (step === 3) {
      if (!formData.consigne_pour_moi) {
        if (!selectedDemandeur) newErrors.demandeur_id = ["Le demandeur est requis"];
        if (!selectedEntreprise) newErrors.entreprise_id = ["L'entreprise est requise"];
      }
      if (!signaturePadDemandeur.current || signaturePadDemandeur.current.isEmpty()) {
        newErrors.signature_demandeur = ["La signature est requise"];
      }
    } else if (step === 4) {
      if (!signaturePadAttestation.current || signaturePadAttestation.current.isEmpty()) {
        newErrors.signature_attestation = ["La signature est requise"];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && formData.consigne_pour_moi) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 4 && formData.consigne_pour_moi) {
      setCurrentStep(2);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReturn = () => {
    navigate(-1);
  };

  const appendTimezoneOffset = (localDateTimeString) => {
    const localDate = new Date(localDateTimeString);
    const offsetMinutes = -localDate.getTimezoneOffset();
    const pad = (n) => String(n).padStart(2, "0");
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
    const offsetRemMinutes = pad(Math.abs(offsetMinutes) % 60);
    return `${localDateTimeString}${sign}${offsetHours}:${offsetRemMinutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      // Process site
      let finalSite = selectedSite;
      if (selectedSite && selectedSite.__isNew__) {
        const { data, error } = await supabase.from("sites").insert({ name: selectedSite.label }).select();
        if (!error) {
          finalSite = { value: Number(data[0].id), label: data[0].name };
          setSites((prev) => [...prev, finalSite]);
        }
      }

      // Process zone
      let finalZone = selectedZone;
      if (selectedZone && selectedZone.__isNew__) {
        const { data, error } = await supabase.from("zones").insert({ name: selectedZone.label, site_id: selectedSite ? Number(selectedSite.value) : null }).select();
        if (!error) {
          finalZone = { value: Number(data[0].id), label: data[0].name };
          setZones((prev) => [...prev, finalZone]);
        }
      }

      // Process consignateur
      let finalConsignateur = selectedConsignateur;
      if (selectedConsignateur && selectedConsignateur.__isNew__) {
        const newPerson = { name: selectedConsignateur.label };
        if (selectedEntrepriseUtilisatrice) {
          newPerson.entreprise_id = Number(selectedEntrepriseUtilisatrice.value);
        }
        const { data, error } = await supabase.from("persons").insert(newPerson).select();
        if (!error) {
          finalConsignateur = { value: Number(data[0].id), label: data[0].name };
          setConsignateurs((prev) => [...prev, finalConsignateur]);
        }
      }

      // Process entreprise
      let finalEntreprise = selectedEntreprise;
      if (selectedEntreprise && selectedEntreprise.__isNew__) {
        const { data, error } = await supabase.from("entreprises").insert({ name: selectedEntreprise.label }).select();
        if (!error) {
          finalEntreprise = { value: Number(data[0].id), label: data[0].name };
          setEntreprises((prev) => [...prev, finalEntreprise]);
        }
      }

      // Process demandeur
      let finalDemandeur = selectedDemandeur;
      if (selectedDemandeur && selectedDemandeur.__isNew__) {
        const newPerson = { name: selectedDemandeur.label };
        if (finalEntreprise) {
          newPerson.entreprise_id = Number(finalEntreprise.value);
        }
        const { data, error } = await supabase.from("persons").insert(newPerson).select();
        if (!error) {
          finalDemandeur = { value: Number(data[0].id), label: data[0].name };
          setDemandeurs((prev) => [...prev, finalDemandeur]);
        }
      }

      let finalEntrepriseUtilisatrice = selectedEntrepriseUtilisatrice;
      const fullDateTime = appendTimezoneOffset(formData.date_consignation);

      const updatedFormData = {
        ...formData,
        date_consignation: fullDateTime,
        entreprise_utilisatrice_id: finalEntrepriseUtilisatrice ? Number(finalEntrepriseUtilisatrice.value) : "",
        site_id: finalSite ? Number(finalSite.value) : "",
        zone_id: finalZone ? Number(finalZone.value) : "",
        consignateur_id: finalConsignateur ? Number(finalConsignateur.value) : "",
        demandeur_id: finalDemandeur ? Number(finalDemandeur.value) : "",
        entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
        signature_consignateur: signaturePadConsignateur.current && !signaturePadConsignateur.current.isEmpty()
          ? signaturePadConsignateur.current.toDataURL() : "",
        signature_demandeur: formData.consigne_pour_moi
          ? (signaturePadConsignateur.current && !signaturePadConsignateur.current.isEmpty()
            ? signaturePadConsignateur.current.toDataURL() : "")
          : (signaturePadDemandeur.current && !signaturePadDemandeur.current.isEmpty()
            ? signaturePadDemandeur.current.toDataURL() : ""),
        signature_attestation: signaturePadAttestation.current && !signaturePadAttestation.current.isEmpty()
          ? signaturePadAttestation.current.toDataURL() : "",
        created_by: user.id,
        updated_by: user.id,
      };

      const { types_consignation, consigne_pour_ee, ...dataToInsert } = updatedFormData;
      const { data, error } = await supabase.from("consignations").insert([dataToInsert]).select();

      if (error) {
        console.error("Erreur lors de l'insertion de la consignation :", error);
        return;
      }

      if (selectedTypesconsignations && selectedTypesconsignations.length > 0) {
        const consignationId = data[0].id;
        const junctionInserts = selectedTypesconsignations.map((typeId) => ({
          cons_id: consignationId,
          typ_cons_id: typeId,
        }));
        await supabase.from("consignation_types_junction").insert(junctionInserts);
      }

      navigate("/home");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear signature functions
  const clearSignatureConsignateur = () => {
    if (signaturePadConsignateur.current) signaturePadConsignateur.current.clear();
    if (isMobile && navigator.vibrate) navigator.vibrate(50);
  };

  const clearSignatureDemandeur = () => {
    if (signaturePadDemandeur.current) signaturePadDemandeur.current.clear();
    if (isMobile && navigator.vibrate) navigator.vibrate(50);
  };

  const clearSignatureAttestation = () => {
    if (signaturePadAttestation.current) signaturePadAttestation.current.clear();
    if (isMobile && navigator.vibrate) navigator.vibrate(50);
  };

  // Planified handlers
  const handlePlanifiedClick = (e) => {
    e.preventDefault();
    if (!selectedSite || !selectedZone || !selectedEntreprise) return;
    setShowTimeDialog(true);
  };

  const handleDatetimeConfirm = async () => {
    const newDatetime = datetimeValue;
    setFormData((prev) => ({ ...prev, date_consignation: newDatetime }));
    setShowTimeDialog(false);
    await submitPlanified(newDatetime);
    navigate("/consignationplanified");
  };

  const submitPlanified = async (newDatetime) => {
    let newErrors = {};
    if (!selectedSite) newErrors.site_id = ["Le site est requis"];
    if (!selectedZone) newErrors.zone_id = ["La zone est requis"];
    if (!selectedEntreprise) newErrors.entreprise_id = ["L'entreprise est requise"];
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalDate = newDatetime || formData.date_consignation;

    let finalSite = selectedSite;
    if (selectedSite && selectedSite.__isNew__) {
      const { data, error } = await supabase.from("sites").insert({ name: selectedSite.label }).select();
      if (!error) {
        finalSite = { value: Number(data[0].id), label: data[0].name };
        setSites((prev) => [...prev, finalSite]);
      }
    }

    let finalZone = selectedZone;
    if (selectedZone && selectedZone.__isNew__) {
      const { data, error } = await supabase.from("zones").insert({ name: selectedZone.label, site_id: selectedSite ? Number(selectedSite.value) : null }).select();
      if (!error) {
        finalZone = { value: Number(data[0].id), label: data[0].name };
        setZones((prev) => [...prev, finalZone]);
      }
    }

    let finalConsignateur = selectedConsignateur;
    if (selectedConsignateur && selectedConsignateur.__isNew__) {
      const newPerson = { name: selectedConsignateur.label };
      if (selectedEntrepriseUtilisatrice) {
        newPerson.entreprise_id = Number(selectedEntrepriseUtilisatrice.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (!error) {
        finalConsignateur = { value: Number(data[0].id), label: data[0].name };
        setConsignateurs((prev) => [...prev, finalConsignateur]);
      }
    }

    let finalEntreprise = selectedEntreprise;
    if (selectedEntreprise && selectedEntreprise.__isNew__) {
      const { data, error } = await supabase.from("entreprises").insert({ name: selectedEntreprise.label }).select();
      if (!error) {
        finalEntreprise = { value: Number(data[0].id), label: data[0].name };
        setEntreprises((prev) => [...prev, finalEntreprise]);
      }
    }

    let finalDemandeur = selectedDemandeur;
    if (selectedDemandeur && selectedDemandeur.__isNew__) {
      const newPerson = { name: selectedDemandeur.label };
      if (finalEntreprise) {
        newPerson.entreprise_id = Number(finalEntreprise.value);
      }
      const { data, error } = await supabase.from("persons").insert(newPerson).select();
      if (!error) {
        finalDemandeur = { value: Number(data[0].id), label: data[0].name };
        setDemandeurs((prev) => [...prev, finalDemandeur]);
      }
    }

    const updatedFormData = {
      ...formData,
      date_consignation: finalDate,
      entreprise_utilisatrice_id: selectedEntrepriseUtilisatrice ? Number(selectedEntrepriseUtilisatrice.value) : "",
      site_id: finalSite ? Number(finalSite.value) : "",
      zone_id: finalZone ? Number(finalZone.value) : "",
      consignateur_id: finalConsignateur ? Number(finalConsignateur.value) : "",
      entreprise_id: finalEntreprise ? Number(finalEntreprise.value) : "",
      signature_consignateur: signaturePadConsignateur.current && !signaturePadConsignateur.current.isEmpty()
        ? signaturePadConsignateur.current.toDataURL() : "",
      signature_demandeur: "",
      signature_attestation: signaturePadAttestation.current && !signaturePadAttestation.current.isEmpty()
        ? signaturePadAttestation.current.toDataURL() : "",
      status: "planified",
      created_by: user.id,
      updated_by: user.id,
    };

    const { types_consignation, consigne_pour_ee, ...dataToInsert } = updatedFormData;
    const { data, error } = await supabase.from("consignations").insert([dataToInsert]).select();
    if (error) {
      console.error("Erreur lors de l'insertion de la consignation planifiée :", error);
      return;
    }
    navigate("/consignationplanified");
  };

  // Custom select styles matching the design
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: isMobile ? '48px' : '44px',
      borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#9ca3af'
      }
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: isMobile ? '16px' : '14px',
      color: '#9ca3af'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '10px 12px',
      '&:active': {
        backgroundColor: '#c7d2fe'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e0e7ff',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#4338ca',
      padding: '2px 6px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6366f1',
      '&:hover': {
        backgroundColor: '#c7d2fe',
        color: '#4338ca'
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px'
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    })
  };

  const errorSelectStyles = {
    ...selectStyles,
    control: (base, state) => ({
      ...selectStyles.control(base, state),
      borderColor: '#ef4444',
      '&:hover': {
        borderColor: '#ef4444'
      }
    })
  };

  // Special styles for consignation type select with icons
  const consignationTypeSelectStyles = {
    ...selectStyles,
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: '#e0e7ff'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f3f4f6',
      borderRadius: '0.5rem',
      padding: '2px 4px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#374151',
      padding: '0 4px'
    })
  };

  // Get current step config
  const getCurrentStepConfig = () => {
    return stepConfig.find(s => s.id === currentStep) || stepConfig[0];
  };

  const currentStepConfig = getCurrentStepConfig();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Nouvelle Consignation
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  Étape {currentStep} / 4
                </Badge>
                <Badge className="text-xs bg-indigo-50 border-indigo-200 text-indigo-800 border">
                  {currentStepConfig.title}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Steps Card */}
          <Card className="shadow-md border-0 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center">
                {stepConfig.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const isSkipped = formData.consigne_pour_moi && step.id === 3;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-200 ${
                            isActive
                              ? 'bg-indigo-100 border-indigo-500 text-indigo-600'
                              : isCompleted
                              ? 'bg-green-100 border-green-500 text-green-600'
                              : isSkipped
                              ? 'bg-gray-100 border-gray-300 text-gray-400'
                              : 'bg-gray-50 border-gray-300 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </div>
                        <span className={`mt-2 text-xs sm:text-sm font-medium ${
                          isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        } ${isMobile ? 'hidden' : 'block'}`}>
                          {step.title}
                        </span>
                      </div>
                      {index < stepConfig.length - 1 && (
                        <div className={`w-12 sm:w-20 lg:w-24 h-0.5 mx-2 sm:mx-4 ${
                          currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {/* Step 1 - Site & Work Information */}
            {currentStep === 1 && (
              <>
                {/* Site & Zone Card */}
                <Card className="shadow-md border-0 bg-white mb-6 overflow-visible">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                        <MapPinIcon className="h-4 w-4 text-orange-600" />
                      </div>
                      Localisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 overflow-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Site */}
                      {role !== "technicien" && (
                        <div className="relative">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                              <BuildingOfficeIcon className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            Site <span className="text-red-500">*</span>
                          </label>
                          <CreatableSelect
                            value={selectedSite}
                            onChange={setSelectedSite}
                            options={sites}
                            isClearable
                            placeholder="Sélectionnez un site..."
                            styles={errors.site_id ? errorSelectStyles : selectStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                          {errors.site_id && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                              <ExclamationCircleIcon className="h-4 w-4" />
                              {errors.site_id.join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Zone */}
                      <div className="relative">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
                            <MapPinIcon className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          Zone <span className="text-red-500">*</span>
                        </label>
                        <CreatableSelect
                          value={selectedZone}
                          onChange={setSelectedZone}
                          options={siteZones}
                          isClearable
                          placeholder="Sélectionnez une zone..."
                          styles={errors.zone_id ? errorSelectStyles : selectStyles}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                        {errors.zone_id && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-4 w-4" />
                            {errors.zone_id.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Consignation Type */}
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                          <TagIcon className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        Type de consignation <span className="text-red-500">*</span>
                      </label>
                      <Select
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
                        styles={errors.types_consignation_id ? errorSelectStyles : consignationTypeSelectStyles}
                        components={{
                          Option: ConsignationTypeOption,
                          MultiValue: ConsignationTypeMultiValue
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      {errors.types_consignation_id && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.types_consignation_id.join(", ")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Work Details Card */}
                <Card className="shadow-md border-0 bg-white mb-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <WrenchScrewdriverIcon className="h-4 w-4 text-green-600" />
                      </div>
                      Détails des Travaux
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Désignation des Travaux */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <DocumentTextIcon className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        Désignation des Travaux <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="designation_travaux"
                        value={formData.designation_travaux}
                        onChange={handleChange}
                        placeholder="Décrivez les travaux à effectuer..."
                        className={`w-full rounded-lg border px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isMobile ? 'min-h-[120px] text-base' : 'min-h-[100px] text-sm'
                        } ${errors.designation_travaux ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                      />
                      {errors.designation_travaux && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.designation_travaux.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Équipements & Plan de prévention */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                            <CogIcon className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          Équipements
                        </label>
                        <textarea
                          name="equipements"
                          value={formData.equipements}
                          onChange={handleChange}
                          placeholder="Liste des équipements..."
                          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 ${
                            isMobile ? 'min-h-[100px] text-base' : 'min-h-[80px] text-sm'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                            <ClipboardDocumentListIcon className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          Plan de prévention
                        </label>
                        <textarea
                          name="pdp"
                          value={formData.pdp}
                          onChange={handleChange}
                          placeholder="Numéro du plan de prévention..."
                          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 ${
                            isMobile ? 'min-h-[100px] text-base' : 'min-h-[80px] text-sm'
                          }`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Card */}
                <Card className="shadow-md border-0 bg-white mb-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
                        <ShieldCheckIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      Sécurité et Verrouillage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                            <KeyIcon className="h-3.5 w-3.5 text-yellow-600" />
                          </div>
                          Numéro de cadenas
                        </label>
                        <input
                          type="text"
                          name="cadenas_num"
                          value={formData.cadenas_num}
                          onChange={handleChange}
                          placeholder="Ex: CAD-001"
                          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 ${
                            isMobile ? 'h-12 text-base' : 'text-sm'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                            <LockClosedIcon className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          Lockbox
                        </label>
                        <input
                          type="text"
                          name="lockbox"
                          value={formData.lockbox}
                          onChange={handleChange}
                          placeholder="Ex: LB-001"
                          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 ${
                            isMobile ? 'h-12 text-base' : 'text-sm'
                          }`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 2 - Consignateur Details */}
            {currentStep === 2 && (
              <>
                <Card className="shadow-md border-0 bg-white mb-6 overflow-visible">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <UserIcon className="h-4 w-4 text-green-600" />
                      </div>
                      Informations du Consignateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 overflow-visible">
                    {/* Enterprise Selection */}
                    {role !== "technicien" && (
                      <div className="relative">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                            <BuildingOfficeIcon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          Entreprise utilisatrice <span className="text-red-500">*</span>
                        </label>
                        <CreatableSelect
                          value={selectedEntrepriseUtilisatrice}
                          onChange={setSelectedEntrepriseUtilisatrice}
                          options={entreprises}
                          isClearable
                          placeholder="Sélectionnez une entreprise..."
                          styles={errors.entreprise_id ? errorSelectStyles : selectStyles}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                        {errors.entreprise_id && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-4 w-4" />
                            {errors.entreprise_id.join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Consignateur Selection */}
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <IdentificationIcon className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        Consignateur <span className="text-red-500">*</span>
                      </label>
                      <CreatableSelect
                        value={selectedConsignateur}
                        onChange={setSelectedConsignateur}
                        options={entreprisePersons}
                        isClearable
                        placeholder="Sélectionnez un consignateur..."
                        styles={errors.consignateur_id ? errorSelectStyles : selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      {errors.consignateur_id && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.consignateur_id.join(", ")}
                        </p>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Signature */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                          <PencilSquareIcon className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        Signature du consignateur <span className="text-red-500">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
                        errors.signature_consignateur ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`} style={{ touchAction: 'none' }}>
                        <canvas
                          ref={sigPadConsignateur}
                          className="w-full bg-transparent touch-none"
                          style={{ touchAction: 'none' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearSignatureConsignateur}
                        className={`mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors ${
                          isMobile ? 'w-full h-11' : ''
                        }`}
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Effacer la signature
                      </button>
                      {errors.signature_consignateur && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.signature_consignateur.join(", ")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Options Card */}
                <Card className="shadow-md border-0 bg-white mb-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                        <Bars3BottomLeftIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                      Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Consigné pour moi-même */}
                    <div className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      formData.consigne_pour_moi
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="consigne_pour_moi"
                          checked={formData.consigne_pour_moi}
                          onChange={handleChange}
                          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                            <HandRaisedIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Consigné pour moi-même</p>
                            <p className="text-sm text-gray-600">Je suis également le demandeur de cette consignation</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Informer la salle de contrôle */}
                    <div className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      formData.info_salle_controle
                        ? 'bg-green-50 border-green-300'
                        : errors.info_salle_controle
                        ? 'bg-red-50 border-red-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="info_salle_controle"
                          checked={formData.info_salle_controle}
                          onChange={handleChange}
                          className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            formData.info_salle_controle ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            <ShieldCheckIcon className={`h-4 w-4 ${
                              formData.info_salle_controle ? 'text-green-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Informer la salle de contrôle <span className="text-red-500">*</span>
                            </p>
                            <p className="text-sm text-gray-600">Confirmation d'information de la salle de contrôle</p>
                          </div>
                        </div>
                      </label>
                      {errors.info_salle_controle && (
                        <p className="mt-2 ml-8 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.info_salle_controle.join(", ")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 3 - Demandeur Details */}
            {currentStep === 3 && !formData.consigne_pour_moi && (
              <Card className="shadow-md border-0 bg-white mb-6 overflow-visible">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <UserGroupIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    Informations du Demandeur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 overflow-visible">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Entreprise extérieure */}
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                          <BuildingOfficeIcon className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        Entreprise extérieure <span className="text-red-500">*</span>
                      </label>
                      <CreatableSelect
                        value={selectedEntreprise}
                        onChange={setSelectedEntreprise}
                        options={entreprises}
                        isClearable
                        placeholder="Sélectionnez une entreprise..."
                        styles={errors.entreprise_id ? errorSelectStyles : selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      {errors.entreprise_id && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.entreprise_id.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Demandeur */}
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                          <UserIcon className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        Demandeur <span className="text-red-500">*</span>
                      </label>
                      <CreatableSelect
                        value={selectedDemandeur}
                        onChange={setSelectedDemandeur}
                        options={entreprisePersons}
                        isClearable
                        placeholder="Sélectionnez un demandeur..."
                        styles={errors.demandeur_id ? errorSelectStyles : selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      {errors.demandeur_id && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.demandeur_id.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Signature du demandeur */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                        <PencilSquareIcon className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      Signature du demandeur <span className="text-red-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
                      errors.signature_demandeur ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`} style={{ touchAction: 'none' }}>
                      <canvas
                        ref={sigPadDemandeur}
                        className="w-full bg-transparent touch-none"
                        style={{ touchAction: 'none' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearSignatureDemandeur}
                      className={`mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors ${
                        isMobile ? 'w-full h-11' : ''
                      }`}
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Effacer la signature
                    </button>
                    {errors.signature_demandeur && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        {errors.signature_demandeur.join(", ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4 - Final Review */}
            {currentStep === 4 && (
              <>
                {/* Date Card */}
                <Card className="shadow-md border-0 bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                        <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Date de consignation</h3>
                        <p className="text-sm text-gray-600">Confirmez la date et l'heure</p>
                      </div>
                    </div>
                    <input
                      type="datetime-local"
                      name="date_consignation"
                      value={formData.date_consignation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date_consignation: e.target.value }))}
                      className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 bg-white ${
                        isMobile ? 'h-12 text-base' : 'text-sm'
                      }`}
                    />
                  </CardContent>
                </Card>

                {/* Declaration Card */}
                <Card className="shadow-md border-0 bg-white mb-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                        <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                      Déclaration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Je soussigné M. <span className="font-semibold text-indigo-700">{selectedDemandeur ? selectedDemandeur.label : "N/A"}</span> de l'entreprise{" "}
                        <span className="font-semibold text-indigo-700">{selectedEntreprise ? selectedEntreprise.label : "N/A"}</span> chargé des travaux ci-dessus désignés,
                        déclare avoir reçu le présent avis de consignation et pris connaissance des prescriptions de sécurité.
                      </p>
                    </div>

                    <Separator className="my-4" />

                    {/* Signature d'attestation */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                          <PencilSquareIcon className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        Signature d'attestation <span className="text-red-500">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
                        errors.signature_attestation ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`} style={{ touchAction: 'none' }}>
                        <canvas
                          ref={sigPadAttestation}
                          className="w-full bg-transparent touch-none"
                          style={{ touchAction: 'none' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearSignatureAttestation}
                        className={`mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors ${
                          isMobile ? 'w-full h-11' : ''
                        }`}
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Effacer la signature
                      </button>
                      {errors.signature_attestation && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.signature_attestation.join(", ")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Navigation Buttons */}
            <Card className="shadow-md border-0 bg-white">
              <CardContent className="p-5">
                <div className={`flex items-center ${
                  isMobile ? 'flex-col gap-3' : 'justify-between gap-4'
                }`}>
                  {/* Back Button */}
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md hover:shadow-lg ${
                        isMobile ? 'w-full h-12 order-2' : ''
                      }`}
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      Précédent
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReturn}
                      className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md hover:shadow-lg ${
                        isMobile ? 'w-full h-12 order-2' : ''
                      }`}
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      Retour
                    </button>
                  )}

                  {/* Action Buttons Container */}
                  <div className={`flex gap-3 ${isMobile ? 'w-full flex-col order-1' : ''}`}>
                    {/* Planified Button - Only on Step 3 */}
                    {currentStep === 3 && (
                      <button
                        type="button"
                        onClick={handlePlanifiedClick}
                        className={`flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium shadow-md hover:shadow-lg ${
                          isMobile ? 'w-full h-12' : ''
                        }`}
                      >
                        <CalendarIcon className="h-5 w-5" />
                        Planifier
                      </button>
                    )}

                    {/* Next/Submit Button */}
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className={`flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md hover:shadow-lg ${
                          isMobile ? 'w-full h-12' : ''
                        }`}
                      >
                        Suivant
                        <ArrowRightIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <ButtonSpinner
                        type="submit"
                        loading={isSubmitting}
                        loadingText="Envoi..."
                        className={`flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg ${
                          isMobile ? 'w-full h-12' : ''
                        }`}
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        Envoyer
                      </ButtonSpinner>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      {/* Time Dialog Modal */}
      {showTimeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className={`w-full shadow-2xl border-0 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
                Planifier la consignation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Sélectionnez la date et l'heure pour planifier cette consignation.
              </p>
              <input
                type="datetime-local"
                value={datetimeValue}
                onChange={(e) => setDatetimeValue(e.target.value)}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-gray-400 ${
                  isMobile ? 'h-12 text-base' : 'text-sm'
                }`}
              />
              <div className={`flex gap-3 pt-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                <button
                  type="button"
                  onClick={() => setShowTimeDialog(false)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium ${
                    isMobile ? 'w-full h-11 order-2' : ''
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDatetimeConfirm}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium ${
                    isMobile ? 'w-full h-11 order-1' : ''
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Confirmer
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AddConsignation;