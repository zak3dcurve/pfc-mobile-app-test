import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/utils/auth-context";
import { set } from "zod";
import jsPDF from 'jspdf';
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/app-navbar";



// ✅ ADD THIS ENTIRE COMPONENT TO YOUR FILE

const PhotoModal = ({ photos, onClose }) => {
  return (
    // Transparent backdrop with blur effect
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex justify-center items-center z-50 p-2 sm:p-4" 
      onClick={onClose} // Close modal if you click the background
    >
      {/* The modal content container - responsive */}
      <div 
        className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()} // Prevents modal from closing when clicking inside it
      >
        {/* Header - sticky */}
        <div className="flex justify-between items-center border-b p-3 sm:p-4 bg-white rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Photos de Vérification</h2>
          <button 
            onClick={onClose} 
            className="text-2xl sm:text-3xl font-bold text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            &times;
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* The grid of photos - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="rounded-lg overflow-hidden shadow-md bg-gray-50">
                <img 
                  src={photo.photo_url} 
                  alt="Verification" 
                  className="w-full h-48 sm:h-56 lg:h-64 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer" 
                  onClick={(e) => {
                    // Optional: Open image in full screen on click
                    e.stopPropagation();
                    window.open(photo.photo_url, '_blank');
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Empty state */}
          {photos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune photo disponible</p>
            </div>
          )}
        </div>
        
        {/* Footer - optional */}
        <div className="border-t p-3 sm:p-4 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-600 text-center">
            {photos.length} photo{photos.length > 1 ? 's' : ''} • Cliquez sur une image pour l'agrandir
          </p>
        </div>
      </div>
    </div>
  );
};















const PermisDeFeuDetails = () => {
  const { id } = useParams();
  const [permis, setPermis] = useState(null);
  const [verification, setVerification] = useState(null);
  const [timerData, setTimerData] = useState(null);
  const [verificationForms, setVerificationForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Add states for junction table data
  const [selectedSourcesChaleur, setSelectedSourcesChaleur] = useState([]);
  const [selectedFacteursAggravants, setSelectedFacteursAggravants] = useState([]);
  const [selectedMesuresAvant, setSelectedMesuresAvant] = useState([]);
  const [selectedMesuresPendant, setSelectedMesuresPendant] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  const navigate = useNavigate();
  const { entreprise } = useAuth();
  const isMobile = useIsMobile(); // Move this to the top, before any state

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

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  // Helper function to format time only
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Helper function to add signature image to PDF
  const addSignatureImage = (pdf, signatureData, x, y, width, height) => {
    if (!signatureData) return;
    
    try {
      // Check if it's a valid base64 image
      if (typeof signatureData === 'string' && signatureData.startsWith('data:image/')) {
        pdf.addImage(signatureData, "PNG", x, y, width, height);
      }
    } catch (error) {
      console.error("Error adding signature image:", error);
      // Add text indicating the signature failed to load
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "italic");
      pdf.text("Signature non disponible", x, y + height/2);
    }
  };

  useEffect(() => {
    const fetchTimerData = async () => {  
      setLoading(true);
      const { data, error } = await supabase.from("timer_end")
        .select(`*`) // Get all columns instead of just form_2h
        .eq("pdf_id", id)
        .maybeSingle();
      
      if (error) {
        console.error("Erreur lors de la récupération des données timer :", error);
      } else {
        setTimerData(data);
        setVerification(data); // Keep existing verification logic
      }
      setLoading(false);
    }
    fetchTimerData();
  }, [id]);

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

  // Fetch verification forms data
  useEffect(() => {
    const fetchVerificationForms = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("verification_form")
          .select(`
  *,
  intervenant_person:persons!intervenant(name),
  verification_photos(id, photo_url)
`)
          .eq("pdf_id", id)
          .order("date", { ascending: true });

        if (error) {
          console.error("Erreur lors de la récupération des formulaires de vérification :", error);
        } else {
          setVerificationForms(data || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des formulaires de vérification :", error);
      }
    };

    fetchVerificationForms();
  }, [id]);

  // Fetch junction table data
  useEffect(() => {
    const fetchJunctionData = async () => {
      if (!id) return;

      try {
        // Fetch sources de chaleur
        const { data: sourcesChaleurData } = await supabase
          .from("pdf_sch_junction")
          .select(`
            sch_id,
            sources_chaleur:sch_id(id, name)
          `)
          .eq("pdf_id", id);

        // Fetch facteurs aggravants
        const { data: facteursAggravantsData } = await supabase
          .from("pdf_faggravant_junction")
          .select(`
            faggravant_id,
            facteurs_aggravants:faggravant_id(id, name)
          `)
          .eq("pdf_id", id);

        // Fetch mesures avant
        const { data: mesuresAvantData } = await supabase
          .from("pdf_mpa_junction")
          .select(`
            mpa,
            entreprise,
            mesure_prev_av:mpa(id, name)
          `)
          .eq("pdf", id);

        // Fetch mesures pendant
        const { data: mesuresPendantData } = await supabase
          .from("pdf_mpp_junction")
          .select(`
            mpp,
            entreprise,
            mesure_prev_pn:mpp(id, name)
          `)
          .eq("pdf", id);

        setSelectedSourcesChaleur(sourcesChaleurData || []);
        setSelectedFacteursAggravants(facteursAggravantsData || []);
        setSelectedMesuresAvant(mesuresAvantData || []);
        setSelectedMesuresPendant(mesuresPendantData || []);

      } catch (error) {
        console.error("Erreur lors de la récupération des données de jonction :", error);
      }
    };

    fetchJunctionData();
  }, [id]);



// ✅ ADD THIS HANDLER FUNCTION
const openPhotoModal = (photos) => {
  setSelectedPhotos(photos);
  setIsModalOpen(true);
};



















  const generatePDF = async () => {
    setGeneratingPdf(true);
    
    try {
      // Fetch all the reference data from database
      const [
        { data: sourceChaleurData },
        { data: facteursAggravantsData },
        { data: mesuresAvantData },
        { data: mesuresPendantData }
      ] = await Promise.all([
        supabase.from("sources_chaleur").select("*").order('id'),
        supabase.from("facteurs_aggravants").select("*").order('id'),
        supabase.from("mesure_prev_av").select("*").order('id'),
        supabase.from("mesure_prev_pn").select("*").order('id')
      ]);

      // Get verification forms by type
      const verification15min = verificationForms.find(v => v.type === "15min");
      const verificationDejeuner = verificationForms.find(v => v.type === "dejeuner 15min");
      const verification2h = verificationForms.find(v => v.type === "2h");

      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = 10;
      
      // Set font
      pdf.setFont('helvetica');
      
      // ===========================================
      // SECTION 1: HEADER
      // ===========================================
      
      // SUEZ logo area
      pdf.rect(10, currentY, 45, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUEZ', 12, currentY + 5);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('RECYCLAGE ET VALORISATION FRANCE', 12, currentY + 9);
      
      // PERMIS FEU section
      pdf.rect(55, currentY, 35, 15);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PERMIS FEU', 72.5, currentY + 9, { align: 'center' });
      
      // DATE section
      pdf.rect(90, currentY, 25, 15);
      pdf.setFontSize(8);
      pdf.text('DATE:', 92, currentY + 6);
      pdf.setFontSize(10);
      pdf.text(formatDateOnly(permis.heure_debut), 92, currentY + 12);
      
      // UVE d'Argenteuil header and blank area
      pdf.rect(115, currentY, 85, 8);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('UVE d\'Argenteuil', 157.5, currentY + 6, { align: 'center' });
      pdf.rect(115, currentY + 8, 85, 7); // Blank space
      
      currentY += 15;
      
      // Work section header
      pdf.rect(10, currentY, 190, 5);
      pdf.setFillColor(51, 51, 51);
      pdf.rect(10, currentY, 190, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Travail à effectuer :', 105, currentY + 3.5, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      
      currentY += 5;
      
      // Main content section
      // Left column
      pdf.rect(10, currentY, 130, 25);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lieux et opérations à effectuer :', 12, currentY + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const lieuText = (permis.lieu?.name || '') + '\n' + (permis.operation_description || '');
      const splitText = pdf.splitTextToSize(lieuText, 125);
      pdf.text(splitText, 12, currentY + 8);
      
      // Right column - surveillance section
      pdf.rect(140, currentY, 60, 25);
      
      // Surveillance header with EU*/E.E* cells
      pdf.rect(140, currentY, 40, 8);
      pdf.rect(180, currentY, 10, 8);
      pdf.rect(190, currentY, 10, 8);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Personne responsable ', 142, currentY + 3);
      pdf.text('de la surveillance :', 142, currentY + 3 + 3);

      pdf.text('EU*', 182, currentY + 4);
      pdf.text('E.E*', 192, currentY + 4);
      
      // Add checkmark based on choix_entreprise
      pdf.setFontSize(8);
      if (permis.choix_entreprise === "EU") {
        pdf.text('X', 184, currentY + 4, { align: 'center' });
      } else if (permis.choix_entreprise === "EE") {
        pdf.text('X', 194, currentY + 4, { align: 'center' });
      }
      
      // Name row
      pdf.rect(140, currentY + 8, 40, 8);
      pdf.rect(180, currentY + 8, 10, 8);
      pdf.rect(190, currentY + 8, 10, 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(permis.responsable?.name || '', 142, currentY + 12);
      
      // Travaux réalisés par
      pdf.setFillColor(51, 51, 51);
      pdf.rect(140, currentY + 16, 60, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Travaux réalisés par :', 170, currentY + 19, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      pdf.rect(140, currentY + 21, 60, 4);
      
      currentY += 30;
      
      // ===========================================
      // SECTION 2: DANGERS ET MESURES SPÉCIFIQUES
      // ===========================================
      
      // Main header
      pdf.setFillColor(51, 51, 51);
      pdf.rect(10, currentY, 190, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('I - Dangers et mesures spécifiques', 105, currentY + 4, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      currentY += 6;
      
      // Two column headers
      pdf.setFillColor(200, 200, 200);
      pdf.rect(10, currentY, 95, 5, 'F');
      pdf.rect(105, currentY, 95, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Source de chaleur - Travaux (Énergie d\'activation)', 12, currentY + 3.5);
      pdf.line(105, currentY + 5 , 105, currentY);

      pdf.text('Facteurs aggravants liés à l\'environnement de travail', 107, currentY + 3.5);
      currentY += 5;
      
      // Calculate max rows needed for both columns
      const maxSourceRows = sourceChaleurData?.length || 0;
      const maxFacteurRows = facteursAggravantsData?.length || 0;
      const maxRows = Math.max(maxSourceRows, maxFacteurRows, 1); // At least 1 row
      
      // Draw dynamic rows for both columns
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      let rowY = currentY;

      for (let i = 0; i < maxRows; i++) {
        // Split and count lines for left and right
        let leftLines = 1, rightLines = 1;
        let leftSplit = [], rightSplit = [];

        if (i < maxSourceRows && sourceChaleurData[i]) {
          leftSplit = pdf.splitTextToSize(sourceChaleurData[i].name, 85);
          leftLines = leftSplit.length;
        }
        if (i < maxFacteurRows && facteursAggravantsData[i]) {
          rightSplit = pdf.splitTextToSize(facteursAggravantsData[i].name, 85);
          rightLines = rightSplit.length;
        }

        // pick max line count for row height
        const lineHeight = 3.5; // Or tweak for your font size
        const thisRowHeight = Math.max(leftLines, rightLines) * lineHeight + 1.5;

        // LEFT COLUMN - Sources de chaleur
        pdf.rect(10, rowY, 5, thisRowHeight); // Checkbox
        pdf.rect(15, rowY, 90, thisRowHeight); // Text area

        if (i < maxSourceRows && sourceChaleurData[i]) {
          leftSplit.forEach((line, idx) => {
            pdf.text(line, 17, rowY + 3 + idx * lineHeight);
          });
          const isSelected = selectedSourcesChaleur.some(item =>
            item.sources_chaleur?.id === sourceChaleurData[i].id
          );
          if (isSelected) {
            pdf.setFontSize(8);
            pdf.text('X', 12.5, rowY + 3.5, { align: 'center' });
            pdf.setFontSize(7);
          }
        }

        // RIGHT COLUMN - Facteurs aggravants
        pdf.rect(105, rowY, 5, thisRowHeight); // Checkbox
        pdf.rect(110, rowY, 90, thisRowHeight); // Text area

        if (i < maxFacteurRows && facteursAggravantsData[i]) {
          rightSplit.forEach((line, idx) => {
            pdf.text(line, 112, rowY + 3 + idx * lineHeight);
          });
          const isSelected = selectedFacteursAggravants.some(item =>
            item.facteurs_aggravants?.id === facteursAggravantsData[i].id
          );
          if (isSelected) {
            pdf.setFontSize(8);
            pdf.text('X', 107.5, rowY + 3.5, { align: 'center' });
            pdf.setFontSize(7);
          }
        }

        // move down by this dynamic height
        rowY += thisRowHeight;
      }

      currentY = rowY + 5;
      
      // ===========================================
      // SECTION 3: MESURES DE PRÉVENTION
      // ===========================================
      
      // Prevention header
      pdf.setFillColor(200, 200, 200);
      pdf.rect(10, currentY, 190, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mesures de prévention (cocher cases correspondantes)', 12, currentY + 3.5);
      currentY += 5;
      
      // Table headers
      pdf.setFillColor(220, 220, 220);
      pdf.rect(10, currentY, 140, 5, 'F');
      pdf.rect(150, currentY, 25, 5, 'F');
      pdf.rect(175, currentY, 25, 5, 'F');
      pdf.setFontSize(7);
      pdf.text('Avant le travail', 12, currentY + 3.5);
      pdf.text('E.U*', 160, currentY + 3.5);
      pdf.text('E.E*', 185, currentY + 3.5);
      currentY += 5;
      
      // Dynamic prevention items - AVANT
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      
      if (mesuresAvantData && mesuresAvantData.length > 0) {
        for (let i = 0; i < mesuresAvantData.length; i++) {
          const rowY = currentY + (i * 4);
          pdf.rect(10, rowY, 140, 4);
          pdf.rect(150, rowY, 25, 4);
          pdf.rect(175, rowY, 25, 4);
          
          const mesureName = mesuresAvantData[i].name;
          const splitText = pdf.splitTextToSize(mesureName, 135);
          pdf.text(splitText, 12, rowY + 2.5);
          
          // Check if this item is selected and mark appropriate checkboxes
          const selectedItem = selectedMesuresAvant.find(item => 
            item.mesure_prev_av?.id === mesuresAvantData[i].id
          );
          
          if (selectedItem) {
            pdf.setFontSize(8);
            if (selectedItem.entreprise === 'E.U' || selectedItem.entreprise === 'BOTH') {
              pdf.text('X', 162.5, rowY + 2.5, { align: 'center' });
            }
            if (selectedItem.entreprise === 'E.E' || selectedItem.entreprise === 'BOTH') {
              pdf.text('X', 187.5, rowY + 2.5, { align: 'center' });
            }
            pdf.setFontSize(6);
          }
        }
        currentY += mesuresAvantData.length * 4;
      }
      
      // Pendant le travail section
      pdf.setFillColor(220, 220, 220);
      pdf.rect(10, currentY, 190, 4, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pendant le travail', 12, currentY + 3);
      currentY += 4;
      
      // Dynamic prevention items - PENDANT
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      
      if (mesuresPendantData && mesuresPendantData.length > 0) {
        for (let i = 0; i < mesuresPendantData.length; i++) {
          const rowY = currentY + (i * 4);
          pdf.rect(10, rowY, 140, 4);
          pdf.rect(150, rowY, 25, 4);
          pdf.rect(175, rowY, 25, 4);
          
          const mesureName = mesuresPendantData[i].name;
          const splitText = pdf.splitTextToSize(mesureName, 135);
          pdf.text(splitText, 12, rowY + 2.5);
          
          // Check if this item is selected and mark appropriate checkboxes
          const selectedItem = selectedMesuresPendant.find(item => 
            item.mesure_prev_pn?.id === mesuresPendantData[i].id
          );
          
          if (selectedItem) {
            pdf.setFontSize(8);
            if (selectedItem.entreprise === 'E.U' || selectedItem.entreprise === 'BOTH') {
              pdf.text('X', 162.5, rowY + 2.5, { align: 'center' });
            }
            if (selectedItem.entreprise === 'E.E' || selectedItem.entreprise === 'BOTH') {
              pdf.text('X', 187.5, rowY + 2.5, { align: 'center' });
            }
            pdf.setFontSize(6);
          }
        }
        currentY += mesuresPendantData.length * 4 + 5;
      }
      
      // ===========================================
      // SECTION 4: CONSIGNES EN CAS D'INCENDIE
      // ===========================================
      
      pdf.setFillColor(51, 51, 51);
      pdf.rect(10, currentY, 190, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('II. Consignes en cas d\'incendie', 105, currentY + 3.5, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      currentY += 5;
      
      // Emergency instructions
      pdf.rect(10, currentY, 190, 6);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Alerter la salle de contrôle au numéro suivant 01 34 11 70 15 pour appel des secours et prise en charge OU appuyer sur le', 12, currentY + 3);
      pdf.text('déclencheur manuel d\'incendie.', 12, currentY + 5.5);
      currentY += 6;
      
      pdf.rect(10, currentY, 190, 4);
      pdf.text('Stopper ou limiter l\'incendie avec les équipements appropriés si vous êtes formés (extincteur, RIA...)', 12, currentY + 3);
      currentY += 8;
      
      // ===========================================
      // SECTION 5: DYNAMIC SURVEILLANCE TABLES
      // ===========================================
      
      const tableStartY = currentY;
      const rowHeight = 6;

      // Main headers
      pdf.rect(10, tableStartY, 95, rowHeight);
      pdf.rect(105, tableStartY, 95, rowHeight);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Responsable du site ou délégation', 57.5, tableStartY + 5, { align: 'center' });
      pdf.text('Intervenant', 152.5, tableStartY + 5, { align: 'center' });
      currentY = tableStartY + rowHeight;

      // ===============================
      // MATIN SECTION (Dynamic)
      // ===============================

      // MATIN cell (spans 4 rows vertically)
      pdf.rect(10, currentY, 25, rowHeight * 4);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MATIN', 22.5, currentY + 8, { align: 'center' });
      pdf.text('de', 22.5, currentY + 13, { align: 'center' });

      // Calculate morning times from permis data
      const matinStart = formatTimeOnly(permis.heure_debut);
      
      // Calculate morning end: timer_15min - 15 minutes, or dejeuner_debut if available
      let matinEnd = '';
      if (timerData?.timer_15min) {
        const timer15minDate = new Date(timerData.timer_15min);
        const matinEndDate = new Date(timer15minDate.getTime() - 15 * 60 * 1000); // Subtract 15 minutes
        matinEnd = formatTimeOnly(matinEndDate);
      } else if (permis.dejeuner_debut) {
        matinEnd = formatTimeOnly(permis.dejeuner_debut);
      } else {
        matinEnd = ''; // Leave blank if no data
      }

      pdf.text(matinStart || '___h___', 22.5, currentY + 16, { align: 'center' });
      pdf.text('à', 22.5, currentY + 19, { align: 'center' });
      pdf.text(matinEnd || '___h___', 22.5, currentY + 22, { align: 'center' });

      // Autorisation section
      pdf.rect(35, currentY, 25, rowHeight * 2);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Autorisation', 47.5, currentY + 8, { align: 'center' });

      // Authorization headers
      pdf.rect(60, currentY, 22.5, rowHeight);
      pdf.rect(82.5, currentY, 22.5, rowHeight);
      pdf.rect(105, currentY, 47.5, rowHeight);
      pdf.rect(152.5, currentY, 47.5, rowHeight);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nom', 71.25, currentY + 5, { align: 'center' });
      pdf.text('Visa', 93.75, currentY + 5, { align: 'center' });
      pdf.text('Nom', 128.75, currentY + 5, { align: 'center' });
      pdf.text('Visa', 176.25, currentY + 5, { align: 'center' });
      currentY += rowHeight;

      // Authorization data row with actual data
      pdf.rect(60, currentY, 22.5, rowHeight);
      pdf.rect(82.5, currentY, 22.5, rowHeight);
      pdf.rect(105, currentY, 47.5, rowHeight);
      pdf.rect(152.5, currentY, 47.5, rowHeight);

      // Fill with actual data
      pdf.setFontSize(5);
      // Responsable du site - nom
      pdf.text(permis.site_responsable?.name || '', 61, currentY + 4);
      
      // Responsable du site - signature
      if (permis.resp_site_signature) {
        addSignatureImage(pdf, permis.resp_site_signature, 83.5, currentY + 1, 21, 4);
      }

      // Intervenant - nom (responsable surveillance)
      pdf.text(permis.responsable?.name || '', 106, currentY + 4);
      
      // Intervenant - signature (responsable surveillance)
      if (permis.resp_surv_signature) {
        addSignatureImage(pdf, permis.resp_surv_signature, 153.5, currentY + 1, 46, 4);
      }

      currentY += rowHeight;

      // Surveillance section
      pdf.rect(35, currentY, 25, rowHeight * 2);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Surveillance', 47.5, currentY + 4, { align: 'center' });
      pdf.text('1/4h après', 47.5, currentY + 7, { align: 'center' });
      pdf.text('cessation', 47.5, currentY + 10, { align: 'center' });
      pdf.text('d\'activité', 47.5, currentY + 13, { align: 'center' });

      // Surveillance headers
      pdf.rect(60, currentY, 15, rowHeight);
      pdf.rect(75, currentY, 15, rowHeight);
      pdf.rect(90, currentY, 15, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Heure de', 67.5, currentY + 3, { align: 'center' });
      pdf.text('surveillance', 67.5, currentY + 5.5, { align: 'center' });
      pdf.text('N° photo', 82.5, currentY + 5, { align: 'center' });
      pdf.text('Nom et visa', 97.5, currentY + 5, { align: 'center' });
      pdf.text('Heure d\'arrêt d\'activité', 152.5, currentY + 5, { align: 'center' });
      currentY += rowHeight;

      // Surveillance data row with actual data from verification forms
      pdf.rect(60, currentY, 15, rowHeight);
      pdf.rect(75, currentY, 15, rowHeight);
      pdf.rect(90, currentY, 15, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);

      if (verification15min) {
        pdf.setFontSize(5);
        // 15min surveillance time from verification form
        const surveillance15min = formatTimeOnly(verification15min.date);
        pdf.text(surveillance15min, 67.5, currentY + 4, { align: 'center' });
        
        // Photo number (placeholder)
        pdf.text('', 82.5, currentY + 4, { align: 'center' });
        
        // Nom et visa - intervenant name from verification
        pdf.text(verification15min.intervenant_person?.name || '', 97.5, currentY + 4, { align: 'center' });
        
        // Activity stop time (15 min before surveillance)
        const stopDate = new Date(new Date(verification15min.date).getTime() - 15 * 60 * 1000);
        const stopTime = formatTimeOnly(stopDate);
        pdf.text(stopTime, 152.5, currentY + 4, { align: 'center' });
      }
      currentY += rowHeight;

      // ===============================
      // APRÈS-MIDI SECTION (Dynamic)
      // ===============================

      // APRÈS-MIDI cell (spans 4 rows vertically)
      pdf.rect(10, currentY, 25, rowHeight * 4);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('APRÈS-MIDI', 22.5, currentY + 8, { align: 'center' });
      pdf.text('de', 22.5, currentY + 13, { align: 'center' });

      // Calculate afternoon times
      let apremStart = '';
      const apremEnd = formatTimeOnly(permis.heure_fin);
      
      // Use fin_pause if available, otherwise dejeuner_fin, otherwise leave blank
      if (timerData?.fin_pause) {
        apremStart = formatTimeOnly(timerData.fin_pause);
      } else if (permis.dejeuner_fin) {
        apremStart = formatTimeOnly(permis.dejeuner_fin);
      } else {
        apremStart = ''; // Leave blank if no data
      }

      pdf.text(apremStart || '___h___', 22.5, currentY + 16, { align: 'center' });
      pdf.text('à', 22.5, currentY + 19, { align: 'center' });
      pdf.text(apremEnd || '___h___', 22.5, currentY + 22, { align: 'center' });

      // Autorisation section (same structure as morning)
      pdf.rect(35, currentY, 25, rowHeight * 2);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Autorisation', 47.5, currentY + 8, { align: 'center' });

      // Authorization headers
      pdf.rect(60, currentY, 22.5, rowHeight);
      pdf.rect(82.5, currentY, 22.5, rowHeight);
      pdf.rect(105, currentY, 47.5, rowHeight);
      pdf.rect(152.5, currentY, 47.5, rowHeight);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nom', 71.25, currentY + 5, { align: 'center' });
      pdf.text('Visa', 93.75, currentY + 5, { align: 'center' });
      pdf.text('Nom', 128.75, currentY + 5, { align: 'center' });
      pdf.text('Visa', 176.25, currentY + 5, { align: 'center' });
      currentY += rowHeight;

      // Authorization data row
      pdf.rect(60, currentY, 22.5, rowHeight);
      pdf.rect(82.5, currentY, 22.5, rowHeight);
      pdf.rect(105, currentY, 47.5, rowHeight);
      pdf.rect(152.5, currentY, 47.5, rowHeight);

      // Fill with same data as morning
      pdf.setFontSize(5);
      // Responsable du site - nom
      pdf.text(permis.site_responsable?.name || '', 61, currentY + 4);
      
      // Responsable du site - signature
      if (permis.resp_site_signature) {
        addSignatureImage(pdf, permis.resp_site_signature, 83.5, currentY + 1, 21, 4);
      }
      
      // Intervenant - nom (responsable surveillance)
      pdf.text(permis.responsable?.name || '', 106, currentY + 4);
      
      // Intervenant - signature (responsable surveillance)
      if (permis.resp_surv_signature) {
        addSignatureImage(pdf, permis.resp_surv_signature, 153.5, currentY + 1, 46, 4);
      }

      currentY += rowHeight;

      // Surveillance section
      pdf.rect(35, currentY, 25, rowHeight * 2);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Surveillance', 47.5, currentY + 4, { align: 'center' });
      pdf.text('1/4h après', 47.5, currentY + 7, { align: 'center' });
      pdf.text('cessation', 47.5, currentY + 10, { align: 'center' });
      pdf.text('d\'activité', 47.5, currentY + 13, { align: 'center' });

      // Surveillance headers
      pdf.rect(60, currentY, 15, rowHeight);
      pdf.rect(75, currentY, 15, rowHeight);
      pdf.rect(90, currentY, 15, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Heure de', 67.5, currentY + 3, { align: 'center' });
      pdf.text('surveillance', 67.5, currentY + 5.5, { align: 'center' });
      pdf.text('N° photo', 82.5, currentY + 5, { align: 'center' });
      pdf.text('Nom et visa', 97.5, currentY + 5, { align: 'center' });
      pdf.text('Heure d\'arrêt d\'activité', 152.5, currentY + 5, { align: 'center' });
      currentY += rowHeight;

      // Surveillance data row for afternoon
      pdf.rect(60, currentY, 15, rowHeight);
      pdf.rect(75, currentY, 15, rowHeight);
      pdf.rect(90, currentY, 15, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);

      if (verificationDejeuner) {
        pdf.setFontSize(5);
        // Afternoon surveillance time from verification dejeuner
        const surveillanceAprem = formatTimeOnly(verificationDejeuner.date);
        pdf.text(surveillanceAprem, 67.5, currentY + 4, { align: 'center' });
        
        pdf.text('', 82.5, currentY + 4, { align: 'center' }); // Photo number
        
        // Nom et visa - intervenant name from verification dejeuner
        pdf.text(verificationDejeuner.intervenant_person?.name || '', 97.5, currentY + 4, { align: 'center' });
        
        // End of afternoon work
        pdf.text(formatTimeOnly(permis.heure_fin), 152.5, currentY + 4, { align: 'center' });
      }
      currentY += rowHeight;

      // ===============================
      // CLÔTURE SECTION (Dynamic)
      // ===============================

      // Clôture cell
      pdf.rect(10, currentY, 25, rowHeight * 2);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clôture du', 22.5, currentY + 6, { align: 'center' });
      pdf.text('permis de feu:', 22.5, currentY + 10, { align: 'center' });

      // Surveillance 2h cell
      pdf.rect(35, currentY, 25, rowHeight * 2);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Surveillance', 47.5, currentY + 4, { align: 'center' });
      pdf.text('2h après', 47.5, currentY + 7, { align: 'center' });
      pdf.text('cessation', 47.5, currentY + 10, { align: 'center' });
      pdf.text('d\'activité', 47.5, currentY + 13, { align: 'center' });

      // Clôture headers
      pdf.rect(60, currentY, 11.25, rowHeight);
      pdf.rect(71.25, currentY, 11.25, rowHeight);
      pdf.rect(82.5, currentY, 11.25, rowHeight);
      pdf.rect(93.75, currentY, 11.25, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);
      pdf.setFontSize(4);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Heure de', 65.625, currentY + 3, { align: 'center' });
      pdf.text('surveillance', 65.625, currentY + 5.5, { align: 'center' });
      pdf.text('N° photo', 76.875, currentY + 5, { align: 'center' });
      pdf.text('Nom et visa', 88.125, currentY + 3, { align: 'center' });
      pdf.text('surveillant', 88.125, currentY + 5.5, { align: 'center' });
      pdf.text('Remarques', 99.375, currentY + 3, { align: 'center' });
      pdf.text('éventuelles:', 99.375, currentY + 5.5, { align: 'center' });
      pdf.text('Remarques éventuelles:', 152.5, currentY + 5, { align: 'center' });
      currentY += rowHeight;

      // Clôture data row with actual data
      pdf.rect(60, currentY, 11.25, rowHeight);
      pdf.rect(71.25, currentY, 11.25, rowHeight);
      pdf.rect(82.5, currentY, 11.25, rowHeight);
      pdf.rect(93.75, currentY, 11.25, rowHeight);
      pdf.rect(105, currentY, 95, rowHeight);

      if (verification2h) {
        pdf.setFontSize(4);
        
        // 2h surveillance time from verification form
        const surveillance2h = formatTimeOnly(verification2h.date);
        pdf.text(surveillance2h, 65.625, currentY + 4, { align: 'center' });
        
        // Photo number
        pdf.text('', 76.875, currentY + 4, { align: 'center' });
        
        // Nom et visa - intervenant name from verification 2h
        pdf.text(verification2h.intervenant_person?.name || '', 88.125, currentY + 4, { align: 'center' });
        
        // Remarks from verification 2h
        let remarks = [];
        if (verification2h.result) remarks.push(verification2h.result);
        if (verification2h.motif) remarks.push(verification2h.motif);
        
        const remarksText = remarks.join(' - ');
        if (remarksText) {
          const splitRemarks = pdf.splitTextToSize(remarksText, 90);
          pdf.text(splitRemarks, 107, currentY + 3);
        }
      }
      currentY += rowHeight;
      
      // Document number at bottom
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`N° ${String(permis.id).padStart(4, '0')}`, 190, 285, { align: 'right' });
      
      // Download PDF
      const fileName = `Permis_de_Feu_${String(permis.id).padStart(4, '0')}_${formatDateOnly(permis.heure_debut).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

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
    <div className="min-h-screen bg-gray-100 pt-20 p-2 sm:p-4 sm:pt-24 flex items-center justify-center">
        <div className={`bg-white rounded shadow ${
          isMobile ? 'max-w-full p-4 w-full' : 'max-w-2xl p-8'
        }`}>
          <h1 className={`font-bold text-center mb-6 ${
            isMobile ? 'text-xl' : 'text-3xl'
          }`}>Détails du Permis de Feu</h1>
        <div className="space-y-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Date et Heure de début :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(permis.heure_debut)}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Date et Heure de fin :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(permis.heure_fin)}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Responsable de la surveillance :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{permis.responsable?.name || "non défini"}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Responsable du site :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{permis.site_responsable?.name || "non défini"}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Entreprise :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{permis.entreprise?.name || "non défini"}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Lieu :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{permis.lieu?.name || "non défini"}</span>
          </div>
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Opération à effectuer :</span>
            <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{permis.operation_description || "non défini"}</span>
          </div>
          
          {/* Display Timer Data if available */}
          {timerData && (
            <div className="mt-6 border-t pt-4">
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Données de Surveillance</h2>
              <div className="space-y-2">
                {timerData.timer_15min && (
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
                    <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Surveillance 15min :</span>
                    <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(timerData.timer_15min)}</span>
                  </div>
                )}
                {timerData.timer_dejeuner_15min && (
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
                    <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Surveillance déjeuner 15min :</span>
                    <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(timerData.timer_dejeuner_15min)}</span>
                  </div>
                )}
                {timerData.timer_2h && (
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
                    <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Surveillance 2h :</span>
                    <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(timerData.timer_2h)}</span>
                  </div>
                )}
                {timerData.fin_pause && (
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
                    <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Fin de pause :</span>
                    <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateTime(timerData.fin_pause)}</span>
                  </div>
                )}
                {timerData.resultat_du_control && (
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'}`}>
                    <span className={`font-semibold text-gray-700 ${isMobile ? 'text-sm mb-1' : ''}`}>Résultat du contrôle :</span>
                    <span className={`text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{timerData.resultat_du_control}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display Verification Forms if available */}
          {verificationForms && verificationForms.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Formulaires de Vérification</h2>
              <div className="space-y-4">
                {verificationForms.map((form, index) => (
                  <div key={index} className={`border rounded ${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      <div className={isMobile ? 'text-sm' : ''}>
                        <span className="font-semibold">Type:</span> {form.type}
                      </div>
                      <div className={isMobile ? 'text-sm' : ''}>
                        <span className="font-semibold">Date:</span> {formatDateTime(form.date)}
                      </div>
                      <div className={isMobile ? 'text-sm' : ''}>
                        <span className="font-semibold">Intervenant:</span> {form.intervenant_person?.name || 'N/A'}
                      </div>
                      <div className={isMobile ? 'text-sm' : ''}>
                        <span className="font-semibold">Résultat:</span> {form.result}
                      </div>
                      {form.motif && (
                        <div className={isMobile ? 'text-sm' : 'col-span-2'}>
                          <span className="font-semibold">Motif:</span> {form.motif}
                        </div>
                      )}

                      {/* Photo button */}
                      {form.verification_photos && form.verification_photos.length > 0 && (
                        <div className={isMobile ? 'mt-2' : 'col-span-2 mt-2'}>
                          <button
                            onClick={() => openPhotoModal(form.verification_photos)}
                            className={`bg-indigo-600 text-white px-3 py-1 text-sm rounded hover:bg-indigo-500 ${
                              isMobile ? 'w-full h-10' : ''
                            }`}
                          >
                            Voir les {form.verification_photos.length} Photo(s)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={`flex mt-6 gap-3 ${
          isMobile ? 'flex-col' : 'justify-between'
        }`}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition ${
              isMobile ? 'w-full h-12 order-3' : ''
            }`}
          >
            Retour à la liste
          </button>
          <div className={`flex gap-2 ${
            isMobile ? 'flex-col w-full' : 'flex-row'
          }`}>
            <button
              type="button"
              onClick={generatePDF}
              disabled={generatingPdf}
              className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center transition ${
                isMobile ? 'w-full h-12 order-1' : ''
              }`}
            >
              {generatingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Génération...
                </>
              ) : (
                'Télécharger PDF'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/tes/${id}`)}
              disabled={verification?.form_2h !== null && verification?.form_2h !== undefined}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition ${
                isMobile ? 'w-full h-12 order-2' : ''
              }`}
            >
              Verification
            </button>
          </div>
        </div>
      </div>

    {/* Photo Modal */}
    {isModalOpen && <PhotoModal photos={selectedPhotos} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default PermisDeFeuDetails;