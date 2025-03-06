import { useState } from "react";
import { supabase } from "@/features/auth/utils/supabase-client";

export const useConsignationForm = () => {
  const [formData, setFormData] = useState({
    step: 1,
    site_id: null, // Ensure it matches the database column name
    type_consignation: [], // ENUM ARRAY
    zone_id: null, // Should match `zones` table
    designation_travaux: "",
    equipements: "",
    cadenas_num: "",
    date_heure: new Date().toISOString(), // Format timestamp correctly
    consignateur_id: null, // Should match `persons` table
    signature_consignateur: null, // Nullable if not signed yet
    consigne_pour_moi: false,
    info_salle_controle: false,
    demandeur_id: null, // Should match `persons` table
    signature_demandeur: null, // Nullable if not signed yet
    entreprise_id: null, // Should match `entreprises` table
    is_confirmed: false, // Default value
  });

  const handleNext = () => setFormData((prev) => ({ ...prev, step: prev.step + 1 }));
  const handlePrev = () => setFormData((prev) => ({ ...prev, step: prev.step - 1 }));

  const handleSubmit = async () => {
    const payload = { ...formData };

    // Ensure correct Supabase insertion
    const { data, error } = await supabase.from("consignations").insert([payload]);

    if (error) console.error("Error submitting form:", error);
    else console.log("Form submitted successfully:", data);
  };

  return { formData, handleNext, handlePrev, handleSubmit, setFormData };
};
