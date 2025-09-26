import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/utils/auth-context";
import { set } from "zod";
import jsPDF from 'jspdf';
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/app-navbar";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";


// ✅ ADD THIS ENTIRE COMPONENT TO YOUR FILE

const PhotoModal = ({ photos, onClose }) => {
  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl border-0 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <PhotoIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Photos de Vérification</h2>
              <p className="text-sm text-gray-600">{photos.length} photo{photos.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id || index} className="group relative bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
                  <img
                    src={photo.photo_url}
                    alt={`Vérification ${index + 1}`}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(photo.photo_url, '_blank');
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">Aucune photo disponible</p>
              <p className="text-gray-400 text-sm">Les photos de vérification apparaîtront ici</p>
            </div>
          )}
        </div>

        {photos.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50 text-center">
            <p className="text-sm text-gray-600">
              Cliquez sur une image pour l'ouvrir dans un nouvel onglet
            </p>
          </div>
        )}
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
  const [showMobileActions, setShowMobileActions] = useState(false);

  const navigate = useNavigate();
  const { entreprise } = useAuth();
  const isMobile = useIsMobile(); // Move this to the top, before any state

  // Click outside to close mobile actions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileActions) {
        // Check if the clicked element is not within the FAB container
        const fabContainer = document.getElementById('mobile-fab-container');
        if (fabContainer && !fabContainer.contains(event.target)) {
          setShowMobileActions(false);
        }
      }
    };

    if (showMobileActions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileActions]);

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
          // REPLACE THE pdf.save() LINE WITH THIS:
    const fileName = `Permis_de_Feu_${String(permis.id).padStart(4, '0')}_${formatDateOnly(permis.heure_debut).replace(/\//g, '-')}.pdf`;
    
    // Check if running on mobile/native platform
    if (Capacitor.isNativePlatform()) {
      // For mobile devices
      try {
        // Convert PDF to base64
        const pdfOutput = pdf.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];
        
        // Save the file using Capacitor Filesystem
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        
        // Option 1: Open the PDF with the default PDF viewer
        try {
          await FileOpener.open({
            filePath: savedFile.uri,
            contentType: 'application/pdf',
          });
        } catch (openError) {
          console.log('Could not open file, trying share instead', openError);
          
          // Option 2: Share the PDF if opening fails
          await Share.share({
            title: fileName,
            text: `Permis de Feu ${String(permis.id).padStart(4, '0')}`,
            url: savedFile.uri,
            dialogTitle: 'Partager le PDF',
          });
        }
        
        // Optionally show a success message
        alert(`PDF sauvegardé: ${fileName}`);
        
      } catch (mobileError) {
        console.error('Error saving PDF on mobile:', mobileError);
        alert('Erreur lors de la sauvegarde du PDF sur mobile');
      }
    } else {
      // For web browsers - use the original method
      pdf.save(fileName);
    }
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Détails du Permis de Feu
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                N° {String(permis.id).padStart(4, '0')}
              </Badge>
              {timerData?.timer_2h ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Terminé
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  En cours
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Information Card */}
        <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Date and Time Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-blue-900">Début</span>
                </div>
                <p className="text-sm text-blue-700 font-mono">{formatDateTime(permis.heure_debut)}</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                    <ClockIcon className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-medium text-red-900">Fin</span>
                </div>
                <p className="text-sm text-red-700 font-mono">{formatDateTime(permis.heure_fin)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Personnel Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <UserIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Responsable surveillance</p>
                    <p className="text-sm text-gray-600 truncate">{permis.responsable?.name || "Non défini"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                    <UserIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Responsable site</p>
                    <p className="text-sm text-gray-600 truncate">{permis.site_responsable?.name || "Non défini"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Entreprise</p>
                    <p className="text-sm text-gray-600 truncate">{permis.entreprise?.name || "Non défini"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <MapPinIcon className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Lieu</p>
                    <p className="text-sm text-gray-600 truncate">{permis.lieu?.name || "Non défini"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Operation Description */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                  <WrenchScrewdriverIcon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">Opération à effectuer</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {permis.operation_description || "Non défini"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Surveillance Data Card */}
        {timerData && (
          <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-green-600" />
                Données de Surveillance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timerData.timer_15min && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-900">Surveillance 15min</span>
                    </div>
                    <p className="text-sm text-green-700 font-mono">{formatDateTime(timerData.timer_15min)}</p>
                  </div>
                )}

                {timerData.timer_dejeuner_15min && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-900">Surveillance déjeuner 15min</span>
                    </div>
                    <p className="text-sm text-yellow-700 font-mono">{formatDateTime(timerData.timer_dejeuner_15min)}</p>
                  </div>
                )}

                {timerData.timer_2h && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">Surveillance 2h</span>
                    </div>
                    <p className="text-sm text-blue-700 font-mono">{formatDateTime(timerData.timer_2h)}</p>
                  </div>
                )}

                {timerData.fin_pause && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-900">Fin de pause</span>
                    </div>
                    <p className="text-sm text-purple-700 font-mono">{formatDateTime(timerData.fin_pause)}</p>
                  </div>
                )}
              </div>

              {timerData.resultat_du_control && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <span className="text-sm font-medium text-gray-900 block mb-2">Résultat du contrôle</span>
                  <p className="text-sm text-gray-700">{timerData.resultat_du_control}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification Forms Card */}
        {verificationForms && verificationForms.length > 0 && (
          <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                Formulaires de Vérification ({verificationForms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationForms.map((form, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {form.type}
                        </Badge>
                        {form.result === 'OK' ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            {form.result}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            {form.result}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{formatDateTime(form.date)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {form.intervenant_person?.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {form.motif && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700">{form.motif}</p>
                      </div>
                    )}

                    {form.verification_photos && form.verification_photos.length > 0 && (
                      <button
                        onClick={() => openPhotoModal(form.verification_photos)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <PhotoIcon className="h-4 w-4" />
                        Voir les {form.verification_photos.length} photo(s)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Smart Mobile/Desktop Layout */}
        {/* Mobile: Collapsible FAB + Bottom Sheet */}
        <div className="block sm:hidden">
          {/* Bottom padding to ensure content is scrollable */}
          <div className="h-32"></div>

          {/* Floating Action Button - Mobile Only */}
          <div className="fixed bottom-6 right-6 z-20">
            <div className="relative" id="mobile-fab-container">
              {/* Main FAB */}
              <button
                onClick={() => setShowMobileActions(!showMobileActions)}
                className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
                  showMobileActions ? 'rotate-45' : 'rotate-0'
                }`}
              >
                {showMobileActions ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </button>

              {/* Expandable Action Buttons */}
              {showMobileActions && (
                <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-full shadow-lg transition-all text-sm font-medium whitespace-nowrap"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Retour
                  </button>

                  <button
                    onClick={() => navigate(`/tes/${id}`)}
                    disabled={verification?.form_2h !== null && verification?.form_2h !== undefined}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-full shadow-lg transition-all text-sm font-medium whitespace-nowrap"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Vérification
                  </button>

                  <button
                    onClick={generatePDF}
                    disabled={generatingPdf}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-full shadow-lg transition-all text-sm font-medium whitespace-nowrap"
                  >
                    {generatingPdf ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        PDF...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        PDF
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Fixed Bottom Bar */}
        <div className="hidden sm:block">
          <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-10 shadow-lg" style={{ paddingBottom: 0, marginBottom: 0 }}>
            <div className="max-w-4xl mx-auto p-4" style={{ paddingBottom: '16px' }}>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Retour
                </button>

                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={generatingPdf}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
                >
                  {generatingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Télécharger PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/tes/${id}`)}
                  disabled={verification?.form_2h !== null && verification?.form_2h !== undefined}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <EyeIcon className="h-5 w-5" />
                  Vérification
                </button>
              </div>
            </div>
          </div>
          {/* Bottom Spacing for Fixed Actions - Desktop Only */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* Photo Modal */}
      {isModalOpen && <PhotoModal photos={selectedPhotos} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default PermisDeFeuDetails;