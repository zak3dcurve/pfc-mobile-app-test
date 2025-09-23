import React, { useState, useEffect, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useNavigate, useParams } from "react-router-dom";
import SignaturePad from "signature_pad";
import { useAuth } from "@/features/auth/utils/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";

const AddPermisFeu = () => {
  const { id } = useParams(); // Get permit ID from URL for editing
  const isEditing = Boolean(id);
  const isMobile = useIsMobile();
  
  // Refs for Signature Canvases
  const sigPadSurveillance = useRef(null);
  const signaturePadSurveillance = useRef(null);
  const sigPadSite = useRef(null);
  const signaturePadSite = useRef(null);

  // --------------------------
  // State: Loading and Errors
  // --------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingPermit, setIsLoadingPermit] = useState(isEditing);
  const [loadedPermisData, setLoadedPermisData] = useState(null); // Store loaded permit data
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({}); // Field-specific errors
  
  // Refs for form sections (for more precise scrolling)
  const horairesRef = useRef(null);
  const surveillanceRef = useRef(null);
  const travauxRef = useRef(null);
  const siteResponsableRef = useRef(null);
  const lieuRef = useRef(null);
  const sourceChaleurRef = useRef(null); // Added ref for source de chaleur section

  // --------------------------
  // State: Dropdown Options
  // --------------------------
  const [personOptions, setPersonOptions] = useState([]);
  const [entrepriseOptions, setEntrepriseOptions] = useState([]);
  const [lieuOptions, setLieuOptions] = useState([]);
  const [sourceChaleurOptions, setSourceChaleurOptions] = useState([]);
  const [facteursAggravantsOptions, setFacteursAggravantsOptions] = useState([]);
  const [mesuresAvOptions, setMesuresAvOptions] = useState([]);
  const [mesuresPnOptions, setMesuresPnOptions] = useState([]);

  // --------------------------
  // State: Form Data
  // --------------------------
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [dejeunerDebut, setDejeunerDebut] = useState("");
  const [dejeunerFin, setDejeunerFin] = useState("");
  const [choixEntreprise, setChoixEntreprise] = useState("");
  const [selectedSurveillance, setSelectedSurveillance] = useState(null);
  const [selectedTravauxPerson, setSelectedTravauxPerson] = useState(null);
  const [selectedSiteResponsable, setSelectedSiteResponsable] = useState(null);
  const [selectedEntrepriseSite, setSelectedEntrepriseSite] = useState(null);
  const [selectedLieu, setSelectedLieu] = useState(null);
  const [respSurvSignature, setRespSurvSignature] = useState("");
  const [respSiteSignature, setRespSiteSignature] = useState("");
  const [operationDescription, setOperationDescription] = useState("");
  const [sourceChaleur, setSourceChaleur] = useState([]);
  const [facteursAggravants, setFacteursAggravants] = useState([]);
  const [mesuresPreventionAvSelections, setMesuresPreventionAvSelections] = useState({});
  const [mesuresPreventionPnSelections, setMesuresPreventionPnSelections] = useState({});

  const navigate = useNavigate();
  const { entreprise: entrepriseUtilisatrice } = useAuth();

  // --------------------------
  // Load Existing Permit Data for Editing
  // --------------------------
  const loadPermitData = async (permitId) => {
    try {
      setIsLoadingPermit(true);
      
      // Fetch main permit data
      const { data: permitData, error: permitError } = await supabase
        .from("permis_de_feu")
        .select(`
          *,
          responsables:persons!resp_surveillance_id(id, name, entreprise_id),
          site_responsables:persons!resp_site_id(id, name, entreprise_id),
          entreprise_sites:entreprises!entreprise_resp_site_id(id, name),
          zones:zones!lieu_id(id, name)
        `)
        .eq("id", permitId)
        .single();

      if (permitError) {
        throw new Error(`Erreur lors du chargement du permis: ${permitError.message}`);
      }

      // Store the loaded permit data
      setLoadedPermisData(permitData);

      // Fetch junction table data
      const [
        { data: sourcesData, error: sourcesError },
        { data: facteursData, error: facteursError },
        { data: mesuresAvData, error: mesuresAvError },
        { data: mesuresPnData, error: mesuresPnError }
      ] = await Promise.all([
        supabase.from("pdf_sch_junction").select("sch_id").eq("pdf_id", permitId),
        supabase.from("pdf_faggravant_junction").select("faggravant_id").eq("pdf_id", permitId),
        supabase.from("pdf_mpa_junction").select("mpa, entreprise").eq("pdf", permitId),
        supabase.from("pdf_mpp_junction").select("mpp, entreprise").eq("pdf", permitId)
      ]);

      if (sourcesError || facteursError || mesuresAvError || mesuresPnError) {
        console.warn("Some junction data failed to load");
      }

      // Populate form fields
      const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setHeureDebut(formatDateTime(permitData.heure_debut));
      setHeureFin(formatDateTime(permitData.heure_fin));
      setDejeunerDebut(formatDateTime(permitData.dejeuner_debut));
      setDejeunerFin(formatDateTime(permitData.dejeuner_fin));
      setChoixEntreprise(permitData.choix_entreprise || "");
      setOperationDescription(permitData.operation_description || "");

      // Set selected options
      if (permitData.responsables) {
        setSelectedSurveillance({
          value: permitData.responsables.id,
          label: permitData.responsables.name,
          entreprise_id: permitData.responsables.entreprise_id
        });
      }

      if (permitData.site_responsables) {
        setSelectedSiteResponsable({
          value: permitData.site_responsables.id,
          label: permitData.site_responsables.name,
          entreprise_id: permitData.site_responsables.entreprise_id
        });
      }

      if (permitData.entreprise_sites) {
        setSelectedEntrepriseSite({
          value: permitData.entreprise_sites.id,
          label: permitData.entreprise_sites.name
        });
      }

      if (permitData.zones) {
        setSelectedLieu({
          value: permitData.zones.id,
          label: permitData.zones.name
        });
      }

      // Set junction table data
      if (sourcesData) {
        setSourceChaleur(sourcesData.map(item => item.sch_id));
      }

      if (facteursData) {
        setFacteursAggravants(facteursData.map(item => item.faggravant_id));
      }

      // Set mesures prevention selections
      if (mesuresAvData) {
        const avSelections = {};
        mesuresAvData.forEach(item => {
          if (!avSelections[item.mpa]) {
            avSelections[item.mpa] = { EE: false, EU: false };
          }
          if (item.entreprise === "E.E") {
            avSelections[item.mpa].EE = true;
          } else if (item.entreprise === "E.U") {
            avSelections[item.mpa].EU = true;
          } else if (item.entreprise === "BOTH") {
            avSelections[item.mpa].EE = true;
            avSelections[item.mpa].EU = true;
          }
        });
        setMesuresPreventionAvSelections(avSelections);
      }

      if (mesuresPnData) {
        const pnSelections = {};
        mesuresPnData.forEach(item => {
          if (!pnSelections[item.mpp]) {
            pnSelections[item.mpp] = { EE: false, EU: false };
          }
          if (item.entreprise === "E.E") {
            pnSelections[item.mpp].EE = true;
          } else if (item.entreprise === "E.U") {
            pnSelections[item.mpp].EU = true;
          } else if (item.entreprise === "BOTH") {
            pnSelections[item.mpp].EE = true;
            pnSelections[item.mpp].EU = true;
          }
        });
        setMesuresPreventionPnSelections(pnSelections);
      }

      // Handle signatures
      if (permitData.resp_surv_signature) {
        setRespSurvSignature(permitData.resp_surv_signature);
      }

      if (permitData.resp_site_signature) {
        setRespSiteSignature(permitData.resp_site_signature);
      }

    } catch (error) {
      console.error("Error loading permit data:", error);
      alert(`Erreur lors du chargement du permis: ${error.message}`);
      navigate("/listpermisdefeu");
    } finally {
      setIsLoadingPermit(false);
    }
  };

  // Load signatures into canvas after signature pads are ready
  useEffect(() => {
    if (loadedPermisData && !isLoadingPermit) {
      const loadSignatures = () => {
        if (loadedPermisData.resp_surv_signature && signaturePadSurveillance.current) {
          try {
            signaturePadSurveillance.current.fromDataURL(loadedPermisData.resp_surv_signature);
          } catch (error) {
            console.warn("Failed to load surveillance signature:", error);
          }
        }

        if (loadedPermisData.resp_site_signature && signaturePadSite.current) {
          try {
            signaturePadSite.current.fromDataURL(loadedPermisData.resp_site_signature);
          } catch (error) {
            console.warn("Failed to load site signature:", error);
          }
        }
      };

      // Load signatures after a short delay to ensure pads are ready
      const timer = setTimeout(loadSignatures, 200);
      return () => clearTimeout(timer);
    }
  }, [loadedPermisData, isLoadingPermit]);

  // --------------------------
  // Signature Pad Setup
  // --------------------------
  useEffect(() => {
    const setupSignaturePad = (canvasRef, signaturePadRef) => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        const containerWidth = container.offsetWidth;
        const canvasHeight = isMobile ? 120 : 150;

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
      setupSignaturePad(sigPadSurveillance, signaturePadSurveillance);
      setupSignaturePad(sigPadSite, signaturePadSite);
    }, 100);

    // Handle window resize
    const handleResize = () => {
      if (signaturePadSurveillance.current && signaturePadSite.current) {
        setupSignaturePad(sigPadSurveillance, signaturePadSurveillance);
        setupSignaturePad(sigPadSite, signaturePadSite);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [loadedPermisData, isMobile]); // Re-setup when permit data is loaded or mobile state changes

  // Show database/network errors as alerts (not validation errors)
  useEffect(() => {
    if (errors.length > 0) {
      alert(`Erreur: ${errors.join('\n')}`);
    }
  }, [errors]);

  // --------------------------
  // Validation Function
  // --------------------------
  const validateForm = () => {
    const newFieldErrors = {};
    let firstErrorRef = null;

    if (!heureDebut) {
      newFieldErrors.heureDebut = "Ce champ est requis";
      if (!firstErrorRef) firstErrorRef = horairesRef;
    }
    if (!heureFin) {
      newFieldErrors.heureFin = "Ce champ est requis";
      if (!firstErrorRef) firstErrorRef = horairesRef;
    }
    if (!choixEntreprise) {
      newFieldErrors.choixEntreprise = "Veuillez sélectionner E.E ou E.U";
      if (!firstErrorRef) firstErrorRef = surveillanceRef;
    }
    if (!selectedSurveillance) {
      newFieldErrors.selectedSurveillance = "Veuillez sélectionner un responsable";
      if (!firstErrorRef) firstErrorRef = surveillanceRef;
    }
    
if (!selectedTravauxPerson) {
  newFieldErrors.selectedTravauxPerson = "Veuillez sélectionner une personne";
  if (!firstErrorRef) firstErrorRef = travauxRef;
}
    if (!selectedEntrepriseSite) {
      newFieldErrors.selectedEntrepriseSite = "Veuillez sélectionner une entreprise";
      if (!firstErrorRef) firstErrorRef = siteResponsableRef;
    }
    if (!selectedLieu) {
      newFieldErrors.selectedLieu = "Veuillez sélectionner un lieu";
      if (!firstErrorRef) firstErrorRef = lieuRef;
    }
    if (!operationDescription.trim()) {
      newFieldErrors.operationDescription = "Veuillez décrire l'opération à effectuer";
      if (!firstErrorRef) firstErrorRef = lieuRef;
    }

    // Validate source de chaleur - at least one must be selected
    if (sourceChaleur.length === 0) {
      newFieldErrors.sourceChaleur = "Veuillez sélectionner au moins une source de chaleur";
      if (!firstErrorRef) firstErrorRef = sourceChaleurRef;
    }

    // Check if both signatures are provided
    const hasSurvSignature = signaturePadSurveillance.current && !signaturePadSurveillance.current.isEmpty();
    const hasSiteSignature = signaturePadSite.current && !signaturePadSite.current.isEmpty();
    
    if (!hasSurvSignature) {
      newFieldErrors.signatureSurveillance = "Veuillez signer ce champ";
      if (!firstErrorRef) firstErrorRef = surveillanceRef;
    }
    
    if (!hasSiteSignature) {
      newFieldErrors.signatureSite = "Veuillez signer ce champ";
      if (!firstErrorRef) firstErrorRef = siteResponsableRef;
    }

    // Validate datetime order
    if (heureDebut && heureFin) {
      const debut = new Date(heureDebut);
      const fin = new Date(heureFin);
      if (debut >= fin) {
        newFieldErrors.heureFin = "L'heure de fin doit être après l'heure de début";
        if (!firstErrorRef) firstErrorRef = horairesRef;
      }
    }

    setFieldErrors(newFieldErrors);
    
    // Auto-scroll to first error section if validation fails
    if (Object.keys(newFieldErrors).length > 0 && firstErrorRef?.current) {
      setTimeout(() => {
        firstErrorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
    }
    
    return Object.keys(newFieldErrors).length === 0;
  };

  // --------------------------
  // Handle Changes with Error Clearing
  // --------------------------
  const clearFieldError = (fieldName) => {
    setFieldErrors(prev => {
      const newFieldErrors = { ...prev };
      delete newFieldErrors[fieldName];
      return newFieldErrors;
    });
  };

  const handleSurveillanceChange = async (option) => {
    clearFieldError('selectedSurveillance');
    
    if (option && option.__isNew__) {
      try {
        const { data, error } = await supabase
          .from("persons")
          .insert({ name: option.label, entreprise_id: entrepriseUtilisatrice.id })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const newOption = { value: data.id, label: data.name, entreprise_id: data.entreprise_id };
          setSelectedSurveillance(newOption);
          setPersonOptions((prev) => [...prev, newOption]);
        }
      } catch (error) {
        console.error("Error inserting new responsable:", error);
        alert(`Erreur lors de l'ajout du responsable: ${error.message}`);
      }
    } else {
      setSelectedSurveillance(option);
    }
  };


const handleTravauxPersonChange = async (option) => {
  clearFieldError('selectedTravauxPerson');
  
  if (option && option.__isNew__) {
    if (!selectedEntrepriseSite) {
      alert("Veuillez d'abord sélectionner une entreprise.");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("persons")
        .insert({ name: option.label, entreprise_id: selectedEntrepriseSite.value })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const newOption = { value: data.id, label: data.name, entreprise_id: data.entreprise_id };
        setSelectedTravauxPerson(newOption);
        setPersonOptions((prev) => [...prev, newOption]);
      }
    } catch (error) {
      console.error("Error inserting new travaux person:", error);
      alert(`Erreur lors de l'ajout de la personne: ${error.message}`);
    }
  } else {
    setSelectedTravauxPerson(option);
  }
};


  const handleSiteResponsableChange = async (option) => {
    clearFieldError('selectedSiteResponsable');
    
    if (option && option.__isNew__) {
      if (!selectedEntrepriseSite) {
        alert("Veuillez d'abord sélectionner une entreprise.");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("persons")
          .insert({ name: option.label, entreprise_id: selectedEntrepriseSite.value })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const newOption = { value: data.id, label: data.name, entreprise_id: data.entreprise_id };
          setSelectedSiteResponsable(newOption);
          setPersonOptions((prev) => [...prev, newOption]);
        }
      } catch (error) {
        console.error("Error inserting new site responsable:", error);
        alert(`Erreur lors de l'ajout du responsable du site: ${error.message}`);
      }
    } else {
      setSelectedSiteResponsable(option);
    }
  };

  const handleEntrepriseChange = async (option) => {
    clearFieldError('selectedEntrepriseSite');
    
    if (option && option.__isNew__) {
      try {
        const { data, error } = await supabase
          .from("entreprises")
          .insert({ name: option.label })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const newOption = { value: data.id, label: data.name };
          setSelectedEntrepriseSite(newOption);
          setEntrepriseOptions((prev) => [...prev, newOption]);
        }
      } catch (error) {
        console.error("Erreur lors de l'insertion de la nouvelle entreprise:", error);
        alert(`Erreur lors de l'ajout de l'entreprise: ${error.message}`);
      }
    } else {
      setSelectedEntrepriseSite(option);
    }
  };

  const handleZoneChange = async (option) => {
    clearFieldError('selectedLieu');
    
    if (option && option.__isNew__) {
      try {
        const { data, error } = await supabase
          .from("zones")
          .insert({ 
            name: option.label,
            site_id: 1 // Replace with actual site_id
          })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const newOption = { value: data.id, label: data.name };
          setLieuOptions((prev) => [...prev, newOption]);
          setSelectedLieu(newOption);
        }
      } catch (error) {
        console.error("Erreur lors de l'insertion de la nouvelle zone:", error);
        alert(`Erreur lors de l'ajout du lieu: ${error.message}`);
      }
    } else {
      setSelectedLieu(option);
    }
  };

  // --------------------------
  // Signature Functions
  // --------------------------
  const clearSignatureSurveillance = () => {
    if (signaturePadSurveillance.current) {
      signaturePadSurveillance.current.clear();
    }
    setRespSurvSignature("");
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const clearSignatureSite = () => {
    if (signaturePadSite.current) {
      signaturePadSite.current.clear();
    }
    setRespSiteSignature("");
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const captureSurveillanceSignature = () => {
    if (signaturePadSurveillance.current && !signaturePadSurveillance.current.isEmpty()) {
      return signaturePadSurveillance.current.toDataURL("image/png");
    }
    return "";
  };

  const captureSiteSignature = () => {
    if (signaturePadSite.current && !signaturePadSite.current.isEmpty()) {
      return signaturePadSite.current.toDataURL("image/png");
    }
    return "";
  };

  // --------------------------
  // Helper Functions
  // --------------------------
  const toggleCheckbox = (value, currentArray, setArray) => {
    if (currentArray.includes(value)) {
      setArray(currentArray.filter((item) => item !== value));
    } else {
      setArray([...currentArray, value]);
      // Clear source de chaleur error when an option is selected
      if (setArray === setSourceChaleur) {
        clearFieldError('sourceChaleur');
      }
    }
  };

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
  // Data Fetching
  // --------------------------
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch all data concurrently
        const [
          { data: personsData, error: personsError },
          { data: entreprisesData, error: entreprisesError },
          { data: lieuxData, error: lieuxError },
          { data: schData, error: schError },
          { data: fagData, error: fagError },
          { data: avData, error: avError },
          { data: pnData, error: pnError }
        ] = await Promise.all([
          supabase.from("persons").select("*"),
          supabase.from("entreprises").select("*"),
          supabase.from("zones").select("*"),
          supabase.from("sources_chaleur").select("*"),
          supabase.from("facteurs_aggravants").select("*"),
          supabase.from("mesure_prev_av").select("*"),
          supabase.from("mesure_prev_pn").select("*")
        ]);

        // Handle errors
        const fetchErrors = [];
        if (personsError) fetchErrors.push(`Personnes: ${personsError.message}`);
        if (entreprisesError) fetchErrors.push(`Entreprises: ${entreprisesError.message}`);
        if (lieuxError) fetchErrors.push(`Lieux: ${lieuxError.message}`);
        if (schError) fetchErrors.push(`Sources de chaleur: ${schError.message}`);
        if (fagError) fetchErrors.push(`Facteurs aggravants: ${fagError.message}`);
        if (avError) fetchErrors.push(`Mesures avant: ${avError.message}`);
        if (pnError) fetchErrors.push(`Mesures pendant: ${pnError.message}`);

        if (fetchErrors.length > 0) {
          alert(`Erreur lors du chargement des données:\n${fetchErrors.join('\n')}`);
          return;
        }

        // Set data
        if (personsData) {
          setPersonOptions(personsData.map((p) => ({
            value: p.id,
            label: p.name,
            entreprise_id: p.entreprise_id,
          })));
        }

        if (entreprisesData) {
          setEntrepriseOptions(entreprisesData.map((e) => ({ value: e.id, label: e.name })));
        }

        if (lieuxData) {
          setLieuOptions(lieuxData.map((l) => ({ value: l.id, label: l.name })));
        }

        if (schData) {
          setSourceChaleurOptions(schData.map((item) => ({ value: item.id, label: item.name })));
        }

        if (fagData) {
          setFacteursAggravantsOptions(fagData.map((item) => ({ value: item.id, label: item.name })));
        }

        if (avData) {
          setMesuresAvOptions(avData.map((item) => ({ value: item.id, label: item.name })));
        }

        if (pnData) {
          setMesuresPnOptions(pnData.map((item) => ({ value: item.id, label: item.name })));
        }

        // Load existing permit data if editing
        if (isEditing && id) {
          await loadPermitData(id);
        }

      } catch (error) {
        console.error("Error fetching options:", error);
        alert(`Erreur lors du chargement des données: ${error.message}`);
      }
    };

    fetchOptions();
  }, [id, isEditing]);

  // Auto-select first entreprise (only for new permits)
  useEffect(() => {
    if (!isEditing && entrepriseOptions.length > 0 && !selectedEntrepriseSite) {
      setSelectedEntrepriseSite(entrepriseOptions[0]);
    }
  }, [entrepriseOptions, selectedEntrepriseSite, isEditing]);

  // Default Selections - Only set once when options load (only for new permits)
  useEffect(() => {
    if (!isEditing && mesuresAvOptions.length > 0 && Object.keys(mesuresPreventionAvSelections).length === 0) {
      const defaultAvSelections = {};
      mesuresAvOptions.forEach((opt, index) => {
        if (index < 3 || index === 4 || index === 8) {
          defaultAvSelections[opt.value] = { EU: true, EE: false };
        }
      });
      setMesuresPreventionAvSelections(defaultAvSelections);
    }
  }, [mesuresAvOptions, isEditing]);

  useEffect(() => {
    if (!isEditing && mesuresPnOptions.length > 0 && Object.keys(mesuresPreventionPnSelections).length === 0) {
      const defaultPnSelections = {};
      mesuresPnOptions.slice(0, 3).forEach((opt) => {
        defaultPnSelections[opt.value] = { EU: true, EE: false };
      });
      setMesuresPreventionPnSelections(defaultPnSelections);
    }
  }, [mesuresPnOptions, isEditing]);

  // --------------------------
  // Save Function (shared by both buttons)
  // --------------------------
  const savePermis = async (status = "normal") => {
    try {
      // Capture signatures (may be empty for draft)
      const survSignature = captureSurveillanceSignature();
      const siteSignature = captureSiteSignature();

      // Build payload with all current form data
      const payload = {
        heure_debut: appendTimezoneOffset(heureDebut),
        heure_fin: appendTimezoneOffset(heureFin),
        dejeuner_debut: dejeunerDebut ? appendTimezoneOffset(dejeunerDebut) : null,
        dejeuner_fin: dejeunerFin ? appendTimezoneOffset(dejeunerFin) : null,
        choix_entreprise: choixEntreprise || null,
        resp_surveillance_id: selectedSurveillance ? parseInt(selectedSurveillance.value) : null,
        resp_surv_signature: survSignature || null,
        resp_site_id: selectedSiteResponsable ? parseInt(selectedSiteResponsable.value) : null,
        resp_site_signature: siteSignature || null,
        entreprise_resp_site_id: selectedEntrepriseSite ? parseInt(selectedEntrepriseSite.value) : null,
        lieu_id: selectedLieu ? parseInt(selectedLieu.value) : null,
        operation_description: operationDescription.trim() || null,
        status: status,
        travaux_par_id: selectedTravauxPerson ? parseInt(selectedTravauxPerson.value) : null,

      };

      console.log("Saving permis with payload:", payload);

      let permisId;
      let permisData;

      if (isEditing) {
        // Update existing permit
        const { data: updatedData, error: updateError } = await supabase
          .from("permis_de_feu")
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour du permis: ${updateError.message}`);
        }

        permisData = updatedData;
        permisId = id;

        // Delete existing junction data
        await Promise.all([
          supabase.from("pdf_sch_junction").delete().eq("pdf_id", permisId),
          supabase.from("pdf_faggravant_junction").delete().eq("pdf_id", permisId),
          supabase.from("pdf_mpa_junction").delete().eq("pdf", permisId),
          supabase.from("pdf_mpp_junction").delete().eq("pdf", permisId)
        ]);
      } else {
        // Insert new permit
        const { data: newData, error: insertError } = await supabase
          .from("permis_de_feu")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Erreur lors de l'insertion du permis: ${insertError.message}`);
        }

        permisData = newData;
        permisId = permisData.id;
      }

      console.log("Permis saved with ID:", permisId);

      // Sequential junction table inserts with error handling
      const insertionErrors = [];

      // Insert source de chaleur (if any selected)
      if (sourceChaleur.length > 0) {
        const rows = sourceChaleur.map((item) => ({
          pdf_id: permisId,
          sch_id: parseInt(item),
        }));
        console.log("Inserting source chaleur:", rows);
        
        const { error } = await supabase.from("pdf_sch_junction").insert(rows);
        if (error) {
          insertionErrors.push(`Sources de chaleur: ${error.message}`);
        }
      }

      // Insert facteurs aggravants (if any selected)
      if (facteursAggravants.length > 0) {
        const rows = facteursAggravants.map((item) => ({
          pdf_id: permisId,
          faggravant_id: parseInt(item),
        }));
        console.log("Inserting facteurs aggravants:", rows);
        
        const { error } = await supabase.from("pdf_faggravant_junction").insert(rows);
        if (error) {
          insertionErrors.push(`Facteurs aggravants: ${error.message}`);
        }
      }

      // Insert Mesures de Prévention AVANT (if any selected)
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
            mpa: parseInt(measureId),
            entreprise: entrepriseValue,
          });
        }
      }
      
      if (avRows.length > 0) {
        console.log("Inserting mesures avant:", avRows);
        const { error } = await supabase.from("pdf_mpa_junction").insert(avRows);
        if (error) {
          insertionErrors.push(`Mesures prévention avant: ${error.message}`);
        }
      }

      // Insert Mesures de Prévention PENDANT (if any selected)
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
            mpp: parseInt(measureId),
            entreprise: entrepriseValue,
          });
        }
      }
      
      if (pnRows.length > 0) {
        console.log("Inserting mesures pendant:", pnRows);
        const { error } = await supabase.from("pdf_mpp_junction").insert(pnRows);
        if (error) {
          insertionErrors.push(`Mesures prévention pendant: ${error.message}`);
        }
      }

      // Check if there were any insertion errors
      if (insertionErrors.length > 0) {
        const actionText = isEditing ? "mis à jour" : (status === "planified" ? "planifié" : "enregistré");
        alert(`Permis ${actionText} mais avec des erreurs:\n${insertionErrors.join('\n')}\n\nVérifiez les données et modifiez le permis si nécessaire.`);
      } else {
        const actionText = isEditing ? "mis à jour" : (status === "planified" ? "planifié" : "enregistré");
        alert(`Permis de Feu ${actionText} avec succès !`);
      }

      // Navigate to details page
      navigate(`/listpermisdefeu/`);

    } catch (error) {
      console.error("Submission error:", error);
      alert(`Erreur: ${error.message}`);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  // --------------------------
  // Handle Form Submit (Validated)
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous field errors
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await savePermis("normal");
    } catch (error) {
      // Error already handled in savePermis
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------
  // Handle Save Draft (No Validation)
  // --------------------------
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      await savePermis("planified");
    } catch (error) {
      // Error already handled in savePermis
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Filter persons for surveillance (only from user's company)
  const filteredPersonOptionsForSurveillance = personOptions.filter(
    (p) => p.entreprise_id === entrepriseUtilisatrice?.id
  );

  // Show loading spinner if loading permit data
  if (isLoadingPermit) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-100">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <h4>Chargement du permis...</h4>
        </div>
      </div>
    );
  }

  // --------------------------
  // Render the Form
  // --------------------------
  return (
    <div className="min-h-screen bg-gray-50 sm:bg-gray-100 overflow-auto pt-20">
      {/* Mobile Header */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Modifier Permis" : "Nouveau Permis"}
          </h1>
          {isEditing && (
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
              Édition
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 pt-4 sm:pt-20">
        <form onSubmit={handleSubmit} noValidate className="max-w-6xl mx-auto bg-white p-4 sm:p-8 rounded-none sm:rounded-lg shadow-none sm:shadow-md">
          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              {isEditing ? "Modifier Permis de Feu" : "Permis de Feu"}
            </h1>
            {isEditing && (
              <div className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded">
                Mode édition
              </div>
            )}
          </div>

        {/* Horaires */}
        <section ref={horairesRef} className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Horaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date et Heure de début <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className={`w-full h-12 sm:h-10 px-4 sm:px-3 py-2 text-base sm:text-sm border rounded-md transition-colors ${
                  fieldErrors.heureDebut ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                value={heureDebut}
                onChange={(e) => {
                  setHeureDebut(e.target.value);
                  clearFieldError('heureDebut');
                }}
              />
              {fieldErrors.heureDebut && (
                <p className="text-sm text-red-600">{fieldErrors.heureDebut}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date et Heure de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className={`w-full h-12 sm:h-10 px-4 sm:px-3 py-2 text-base sm:text-sm border rounded-md transition-colors ${
                  fieldErrors.heureFin ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                value={heureFin}
                onChange={(e) => {
                  setHeureFin(e.target.value);
                  clearFieldError('heureFin');
                }}
              />
              {fieldErrors.heureFin && (
                <p className="text-sm text-red-600">{fieldErrors.heureFin}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Début pause déjeuner</label>
              <input
                type="datetime-local"
                className="w-full h-12 sm:h-10 px-4 sm:px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-colors"
                value={dejeunerDebut}
                onChange={(e) => setDejeunerDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fin pause déjeuner</label>
              <input
                type="datetime-local"
                className="w-full h-12 sm:h-10 px-4 sm:px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-colors"
                value={dejeunerFin}
                onChange={(e) => setDejeunerFin(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Responsable de la surveillance */}
        <section ref={surveillanceRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsable de la surveillance</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Choix (E.E / E.U) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <label className="mr-4 inline-flex items-center">
                <input
                  type="radio"
                  name="surveillance_choice"
                  className="form-radio"
                  value="EE"
                  checked={choixEntreprise === "EE"}
                  onChange={(e) => {
                    setChoixEntreprise(e.target.value);
                    clearFieldError('choixEntreprise');
                  }}
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
                  onChange={(e) => {
                    setChoixEntreprise(e.target.value);
                    clearFieldError('choixEntreprise');
                  }}
                />
                <span className="ml-2">E.U</span>
              </label>
            </div>
            {fieldErrors.choixEntreprise && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.choixEntreprise}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Nom du responsable <span className="text-red-500">*</span>
            </label>
            <CreatableSelect
              options={filteredPersonOptionsForSurveillance}
              value={selectedSurveillance}
              onChange={handleSurveillanceChange}
              placeholder="Sélectionnez ou créez un responsable"
              isDisabled={isSubmitting || isSavingDraft}
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: fieldErrors.selectedSurveillance ? '#ef4444' : base.borderColor,
                  backgroundColor: fieldErrors.selectedSurveillance ? '#fef2f2' : base.backgroundColor,
                })
              }}
            />
            {fieldErrors.selectedSurveillance && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.selectedSurveillance}</p>
            )}
          </div>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Signature du responsable <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-2 bg-gray-50 touch-manipulation ${
              fieldErrors.signatureSurveillance ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}>
              <canvas
                ref={sigPadSurveillance}
                className="w-full border border-gray-200 rounded bg-white touch-none block"
                style={{
                  touchAction: 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
            <button
              type="button"
              onClick={clearSignatureSurveillance}
              className="w-full sm:w-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 font-medium"
              disabled={isSubmitting || isSavingDraft}
            >
              Effacer la signature
            </button>
            {fieldErrors.signatureSurveillance && (
              <p className="text-sm text-red-600">{fieldErrors.signatureSurveillance}</p>
            )}
          </div>
        </section>

        {/* Travaux réalisés par */}
        <section ref={travauxRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Travaux réalisés par</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Nom de la personne <span className="text-red-500">*</span>
            </label>
            <CreatableSelect
              options={personOptions}
              value={selectedTravauxPerson}
onChange={handleTravauxPersonChange}
              placeholder="Sélectionnez ou créez un responsable"
              isDisabled={isSubmitting || isSavingDraft}
styles={{
  control: (base) => ({
    ...base,
    borderColor: fieldErrors.selectedTravauxPerson ? '#ef4444' : base.borderColor, // ✅ Correct field
    backgroundColor: fieldErrors.selectedTravauxPerson ? '#fef2f2' : base.backgroundColor, // ✅ Correct field
  })
}}
            />
            {fieldErrors.selectedTravauxPerson && (
  <p className="mt-1 text-sm text-red-600">{fieldErrors.selectedTravauxPerson}</p>
)}
          </div>
        </section>

        {/* Responsable du site / délégation */}
        <section ref={siteResponsableRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsable du site / délégation</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Entreprise (site) <span className="text-red-500">*</span>
            </label>
            <CreatableSelect
              options={entrepriseOptions}
              value={selectedEntrepriseSite}
              onChange={handleEntrepriseChange}
              placeholder="Sélectionnez ou créez une entreprise"
              isDisabled={isSubmitting || isSavingDraft}
styles={{
  control: (base) => ({
    ...base,
    borderColor: fieldErrors.selectedEntrepriseSite ? '#ef4444' : base.borderColor, // ✅ Correct field
    backgroundColor: fieldErrors.selectedEntrepriseSite ? '#fef2f2' : base.backgroundColor, // ✅ Correct field
  })
}}
            />
            {fieldErrors.selectedEntrepriseSite && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.selectedEntrepriseSite}</p>
            )}
          </div>





{/* ADD THIS: Missing person selection field */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">
      Nom du responsable <span className="text-red-500">*</span>
    </label>
    <CreatableSelect
      options={personOptions.filter(p => p.entreprise_id === selectedEntrepriseSite?.value)}
      value={selectedSiteResponsable}
      onChange={handleSiteResponsableChange}
      placeholder="Sélectionnez ou créez un responsable"
      isDisabled={isSubmitting || isSavingDraft || !selectedEntrepriseSite}
      styles={{
        control: (base) => ({
          ...base,
          borderColor: fieldErrors.selectedSiteResponsable ? '#ef4444' : base.borderColor,
          backgroundColor: fieldErrors.selectedSiteResponsable ? '#fef2f2' : base.backgroundColor,
        })
      }}
    />
    {fieldErrors.selectedSiteResponsable && (
      <p className="mt-1 text-sm text-red-600">{fieldErrors.selectedSiteResponsable}</p>
    )}
  </div>



















          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Signature <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-2 bg-gray-50 touch-manipulation ${
              fieldErrors.signatureSite ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}>
              <canvas
                ref={sigPadSite}
                className="w-full border border-gray-200 rounded bg-white touch-none block"
                style={{
                  touchAction: 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
            <button
              type="button"
              onClick={clearSignatureSite}
              className="w-full sm:w-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 font-medium"
              disabled={isSubmitting || isSavingDraft}
            >
              Effacer la signature
            </button>
            {fieldErrors.signatureSite && (
              <p className="text-sm text-red-600">{fieldErrors.signatureSite}</p>
            )}
          </div>
        </section>

        {/* Lieu et Opération */}
        <section ref={lieuRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Localisation & Opération</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Localisation / Lieu <span className="text-red-500">*</span>
            </label>
            <CreatableSelect
              options={lieuOptions}
              value={selectedLieu}
              onChange={handleZoneChange}
              placeholder="Sélectionnez ou créez une zone..."
              isDisabled={isSubmitting || isSavingDraft}
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: fieldErrors.selectedLieu ? '#ef4444' : base.borderColor,
                  backgroundColor: fieldErrors.selectedLieu ? '#fef2f2' : base.backgroundColor,
                })
              }}
            />
            {fieldErrors.selectedLieu && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.selectedLieu}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Opération à effectuer <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              placeholder="Description de l'opération"
              className={`mt-1 block w-full border rounded p-2 ${
                fieldErrors.operationDescription ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              value={operationDescription}
              onChange={(e) => {
                setOperationDescription(e.target.value);
                clearFieldError('operationDescription');
              }}
              disabled={isSubmitting || isSavingDraft}
            />
            {fieldErrors.operationDescription && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.operationDescription}</p>
            )}
          </div>
        </section>

        {/* Source de Chaleur */}
        <section ref={sourceChaleurRef} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Source de Chaleur <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {sourceChaleurOptions.map((opt) => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={sourceChaleur.includes(opt.value)}
                  onChange={() => toggleCheckbox(opt.value, sourceChaleur, setSourceChaleur)}
                  disabled={isSubmitting || isSavingDraft}
                />
                <span className="ml-2">{opt.label}</span>
              </label>
            ))}
          </div>
          {fieldErrors.sourceChaleur && (
            <p className="mt-2 text-sm text-red-600">{fieldErrors.sourceChaleur}</p>
          )}
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
                  disabled={isSubmitting || isSavingDraft}
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
              <div key={opt.value} className="border p-3 rounded">
                <div className="font-medium mb-2">{opt.label}</div>
                <div className="flex gap-4">
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
                      disabled={isSubmitting || isSavingDraft}
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
                      disabled={isSubmitting || isSavingDraft}
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
              <div key={opt.value} className="border p-3 rounded">
                <div className="font-medium mb-2">{opt.label}</div>
                <div className="flex gap-4">
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
                      disabled={isSubmitting || isSavingDraft}
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
                      disabled={isSubmitting || isSavingDraft}
                    />
                    <span className="ml-1">E.U</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-center">
            {/* Save as Draft Button - Only show if not editing or if editing a planified permit */}
            {(!isEditing || (isEditing && loadedPermisData?.status === "planified")) && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 h-12 sm:h-auto bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
                disabled={isSubmitting || isSavingDraft}
              >
                {isSavingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <span>Sauvegarder comme planifié</span>
                )}
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 h-12 sm:h-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
              disabled={isSubmitting || isSavingDraft}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isEditing ? 'Mise à jour...' : 'Enregistrement...'}</span>
                </>
              ) : (
                <span>{isEditing ? 'Mettre à jour le Permis' : 'Ajouter Permis de Feu'}</span>
              )}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

export default AddPermisFeu;