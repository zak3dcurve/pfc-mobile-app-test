import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/utils/auth-context";
import { set } from "zod";

const PermisDeFeuDetails = () => {
  const { id } = useParams();
  const [permis, setPermis] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { entreprise } = useAuth();

  // Mapping for status if needed (optional)
  const statusMapping = {
    pending: "En attente",
    confirmed: "Consigné",
    deconsigné: "Déconsigné",
    archived: "Archivée",
    planified: "Planifiée",
  };

  

  // Helper function to format date/time in French
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "non défini";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  };


  useEffect(() => {
    const fetchVerification = async () => {  
      setLoading(true);
      const { data, error } = await supabase.from("timer_end")
      .select(`form_2h`)
      .eq("pdf_id", id)
      .maybeSingle();
    if (error) {
      console.error("Erreur lors de la récupération du permis de feu :", error);
    } else {
setVerification(data);  
  }
    setLoading(false);
  }
  fetchVerification();
  }, [id]);


  // Fetch the permis de feu record with its related data.
  useEffect(() => {
    const fetchPermisDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("permis_de_feu")
        .select(`
          *,
          responsable:persons!resp_surveillance_id(name),
          site_responsable:persons!resp_site_id(name),
          entreprise:entreprises!entreprise_resp_site_id(name),
          lieu:zones!lieu_id(name)
        `)
        .eq("id", id)
        .single();
      if (error) {
        console.error("Erreur lors de la récupération du permis de feu :", error);
      } else {
        setPermis(data);
      }
      setLoading(false);
    };

    fetchPermisDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <LoadingSpinner />
      </div>
    );
  }

  if (!permis) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Aucun permis de feu trouvé.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white p-8 mt-50 rounded shadow">
        <h1 className="text-3xl font-bold text-center mb-6">Détails du Permis de Feu</h1>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Date et Heure de début :</span>
            <span className="text-gray-900">{formatDateTime(permis.heure_debut)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Date et Heure de fin :</span>
            <span className="text-gray-900">{formatDateTime(permis.heure_fin)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Responsable de la surveillance :</span>
            <span className="text-gray-900">{permis.responsable?.name || "non défini"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Responsable du site :</span>
            <span className="text-gray-900">{permis.site_responsable?.name || "non défini"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Entreprise :</span>
            <span className="text-gray-900">{permis.entreprise?.name || "non défini"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Lieu :</span>
            <span className="text-gray-900">{permis.lieu?.name || "non défini"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Opération à effectuer :</span>
            <span className="text-gray-900">{permis.operation_description || "non défini"}</span>
          </div>
        </div>
        <div className="flex justify-between mt-6">
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Retour à la liste
          </button>
          {console.log(verification?.form_2h)}
          <button
  type="button"
  onClick={() => navigate(`/tes/${id}`)}
  disabled={verification?.form_2h !== null && verification?.form_2h !== undefined}
  className="
    bg-blue-600
    text-white
    px-4
    py-2
    rounded

    hover:bg-blue-500

    disabled:opacity-50
    disabled:hover:bg-blue-600
  "
>
  Verification
</button>
        </div>
      </div>
    </div>
  );
};

export default PermisDeFeuDetails;
