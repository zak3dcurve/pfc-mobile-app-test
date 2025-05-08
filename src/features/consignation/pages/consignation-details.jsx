import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { useAuth } from "@/features/auth/utils/auth-context";

const ConsignationDetails = () => {
  const { id } = useParams();
  const [consignation, setConsignation] = useState(null);
  const [consignationTypes, setConsignationTypes] = useState([]);
  // NEW: State to hold grouped consignations for multi‑consignation
  const [groupedConsignations, setGroupedConsignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { site } = useAuth();

  const [createdAt, setCreatedAt] = useState("");

  // Password modal state hooks
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  const [deconsignations,setDeconsignations]=useState([]);

  const [consignations, setConsignations] = useState([]);

      // ── Add these at the top of your component ──
  const [singleConsign, setSingleConsign]       = useState(null);
  const [deconsignation, setDeconsignation]     = useState(null);
  

  useEffect(() => {
    if (!consignation) return;                      // wait until the main row is loaded
    if (!consignation.multi_consignation_id) return;
  
    supabase
      .from("consignations")
      .select(`*,
               entreprises:entreprises!entreprise_id(name),
               entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
               demandeur:persons!consignations_demandeur_id_fkey(name)`)
      .eq("multi_consignation_id", consignation.multi_consignation_id)
      .eq("status", "deconsigné")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setDeconsignations(data);
      });
  }, [consignation]);














  // Function to open the modal
  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordInput("");
    setErrorMessage("");
  };

  // Function to check the password and confirm
  const handlePasswordConfirm = () => {
    if (passwordInput === site?.site_password) {
      setShowPasswordModal(false);
      // Proceed with confirmation
      handleConfirmation(consignation.id, consignation.status);
    } else {
      setErrorMessage("Mot de passe incorrect");
    }
  };


  // 1c) Fetch the matching déconsignation row
  useEffect(() => {
    if (!singleConsign) return;
  
    const fetchDecon = async () => {
      const { data, error } = await supabase
        .from("deconsignations")
        .select("created_at")
        .eq("consignation_id", singleConsign.id)
        .maybeSingle();
  
      if (!error) setDeconsignation(data);
    };
    fetchDecon();
  }, [singleConsign]);

// 1a) Fetch **all** consignations for the table (pending/confirmed)
useEffect(() => {
  const fetchConsignations = async () => {
    const { data, error } = await supabase
      .from("consignations")
      .select(`
        *,
        sites(name),
        entreprises:entreprises!entreprise_id(name),
        entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
        demandeur:persons!consignations_demandeur_id_fkey(name),
        zones(name),
        consignation_types_junction (
          types_consignation (id,type_name)
        )
      `)
      .eq("multi_consignation_id", id)
      .in("status", ["pending","confirmed"])
      .order("created_at", { ascending: false });

    if (!error) setConsignations(data);
    setLoading(false);
  };
  fetchConsignations();
}, [id]);
  


// 1b) Fetch **one** consignation (for header & “exécutée” block)
useEffect(() => {
  if (!consignations.length) return;

  const firstId = consignations[0].id;
  const fetchOne = async () => {
    const { data, error } = await supabase
      .from("consignations")
      .select(`
        *,
        sites(name),
        zones(name),
        entreprises:entreprises!entreprise_id(name),
        entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
        demandeur:persons!consignations_demandeur_id_fkey(name),
        consignateur:persons!consignations_consignateur_id_fkey(name)
      `)
      .eq("id", firstId)
      .maybeSingle();

    if (!error) setSingleConsign(data);
  };
  fetchOne();
}, [consignations]);

  /* Realtime subscription for consignation details */
  useEffect(() => {
    const channel = supabase
      .channel("consignation-details")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "consignations" },
        async (payload) => {
          if (Number(payload.new.id) === Number(id)) {
            const { data, error } = await supabase
              .from("consignations")
              .select(`
                *,
                sites(name),
                zones(name),
                entreprises:entreprises!entreprise_id(name),
                entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
                demandeur:persons!consignations_demandeur_id_fkey(name),
                consignateur:persons!consignations_consignateur_id_fkey(name)
              `)
              .eq("id", id)
              .single();
            if (error) {
              console.error("Erreur en temps réel lors de la récupération des détails de consignation :", error);
            } else {
              setConsignation(data);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "consignations" },
        (payload) => {
          if (Number(payload.old.id) === Number(id)) {
            console.log("Consignation supprimée en temps réel.");
            setConsignation(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (consignation && (consignation.status === "deconsigné" || consignation.status === "archived")) {
      const fetchData = async () => {
        try {
          const { data, error } = await supabase
            .from("deconsignations")
            .select("created_at")
            .eq("consignation_id", id)
            .single();
  
          if (error) {
            console.error("Erreur en temps réel lors de la récupération des détails de déconsignation :", error);
          } else {
            setCreatedAt(data);
            console.log("Données récupérées:", data);
          }
        } catch (err) {
          console.error("Erreur inattendue :", err);
        }
      };
  
      fetchData();
    }
  }, [id, consignation]);
  // Helper function to format date and time in French
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  };

  const statusMapping = {
    pending: "En attente",
    confirmed: "Consigné",
    "deconsigné": "Déconsigné",
    archived: "Archivée",
    planified: "Planifiée",
  };

  // Fetch consignation data (including grouping logic for multi‑consignation)
  useEffect(() => {
    const fetchConsignation = async () => {
      const { data, error } = await supabase
        .from("consignations")
        .select(`
          *,
          sites(name),
          zones(name),
          entreprises:entreprises!entreprise_id(name),
          entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
          demandeur:persons!consignations_demandeur_id_fkey(name),
          consignateur:persons!consignations_consignateur_id_fkey(name)
        `)
        .eq("id", id)
        .single();
      if (error) {
        console.error("Erreur lors de la récupération des détails de consignation :", error);
      } else {
        console.log("Données récupérées :", data);
        setConsignation(data);
        // If the consignation is part of a multi‑consignation group, fetch all associated records.
        if (data.multi_consignation_id) {
          const { data: grouped, error: groupError } = await supabase
            .from("consignations")
            .select(`
              *,
              sites(name),
              zones(name),
              entreprises:entreprises!entreprise_id(name),
              entreprise_utilisatrice:entreprises!consignations_entreprise_utilisatrice_id_fkey(name),
              demandeur:persons!consignations_demandeur_id_fkey(name),
              consignateur:persons!consignations_consignateur_id_fkey(name)
            `)
            .eq("multi_consignation_id", data.multi_consignation_id);
          if (groupError) {
            console.error("Erreur lors de la récupération des consignations groupées :", groupError);
          } else {
            setGroupedConsignations(grouped);
          }
        }
      }
      setLoading(false);
    };
    fetchConsignation();
  }, [id]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data: typesData, error } = await supabase
        .from("consignation_types_junction")
        .select(`
          *,
          type:types_consignation (id, type_name)
        `)
        .eq("cons_id", id);
      if (error) {
        console.error("Erreur lors de la récupération des types de consignation :", error);
        return;
      }
      console.log(typesData);
      setConsignationTypes(typesData);
    };
    fetchTypes();
  }, [id]);




  useEffect(() => {
    setConsignation(null);
    setGroupedConsignations([]);
    setConsignationTypes([]);
    setCreatedAt("");
    setLoading(true);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <LoadingSpinner />
      </div>
    );
  }
  if (!consignation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Aucune consignation trouvée.</p>
      </div>
    );
  }

  // Confirmation handlers remain unchanged except for language
  const handleConfirmationDeconsignation = async (id, status) => {
    if (status === "deconsigné") {
      try {
        const { error } = await supabase
          .from("consignations")
          .update({ status: "archived" })
          .eq("id", Number(id));
        if (error) console.error("Erreur lors de la mise à jour de la consignation :", error);
      } catch (err) {
        console.error("Erreur inattendue :", err);
      }
    }
    navigate("/consignationList");
  };

  const handleConfirmation = async (id, status) => {
    if (status === "pending") {
      try {
        const { error } = await supabase
          .from("consignations")
          .update({ status: "confirmed" })
          .eq("id", Number(id));
        if (error) console.error("Erreur lors de la mise à jour de la consignation :", error);
      } catch (err) {
        console.error("Erreur inattendue :", err);
      }
    }
    navigate("/consignationList");
  };

  const handleContinuationConsignation = async (id, status) => {
    if (status === "planified") {
      navigate("/continueconsignationplanified/" + id);
    }
  };










  
  const generateExactFormPDF = (consData, deconsData, typesData, groupedConsignations = null, groupedDeconsData = null) => {
      const doc = new jsPDF("p", "pt", "a4");
      const marginX = 30;
      const marginY = 30;
      const pageWidth = 595;
      const pageHeight = 842;
      const usableWidth = pageWidth - marginX * 2; // ~535 points
  
      // Helper for PDF date formatting
      const formatDateTimePDF = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })}`;
      };
    
      // 1. Title and header image
      doc.addImage(
        "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",
        "PNG",
        marginX + 5,
        marginY - 15,
        90,
        30
      );
  
      const execConsDate   = formatDateTimePDF(consData.created_at);
      const execDeconDate  = formatDateTimePDF(deconsData.created_at);
      const siteName       = consData.sites?.name || "";           // same site for both
      const executant      = consData.consignateur?.name || "";
      const userCompany    = consData.entreprise_utilisatrice?.name || "";
      const lockboxId      = consData.lockbox || "";
      const signerImg      = consData.signature_demandeur || null;
        
    
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("BORDEREAU DE CONSIGNATION - DÉCONSIGNATION POUR TRAVAUX", pageWidth / 2, marginY + 15, { align: "center" });
    
      // 2. "Sur le site" rectangle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.rect(marginX, marginY + 30, usableWidth, 40, "S");
      console.log(siteName);
      doc.text(`Sur le site : ${siteName}`, marginX + 5, marginY + 55);
    
      // 3. TYPE CONSIGNATION table
      const hasType1 = typesData.some(item => item.type.id === 1);
      const hasType2 = typesData.some(item => item.type.id === 2);
      const hasType3 = typesData.some(item => item.type.id === 3);
      console.log("Type IDs from consignationTypes:", typesData.map(item => item.type ? item.type.id : "undefined"));
    
      const typeTableY = marginY + 80;
      const typeTableH = 80;
      doc.rect(marginX, typeTableY, usableWidth, typeTableH, "S");
      const cellWidth = usableWidth / 3;
      doc.line(marginX + cellWidth, typeTableY + 20, marginX + cellWidth, typeTableY + typeTableH);
      doc.line(marginX + 2 * cellWidth, typeTableY + 20, marginX + 2 * cellWidth, typeTableY + typeTableH);
      doc.line(marginX, typeTableY + 20, marginX + usableWidth, typeTableY + 20);
    
      doc.setFont("helvetica", "bold");
      doc.text("TYPE CONSIGNATION", marginX + usableWidth / 2 - 50, typeTableY + 15);
      doc.text("Installations électriques", marginX + 5, typeTableY + 35);
      doc.setFontSize(14);
      if (hasType1) {
        doc.text("X", marginX + 80, typeTableY + 65);
      }
      doc.setFontSize(9);
      doc.text("fluide thermique, hydraulique, frigorigène, gaz, produit dangereux.", marginX + cellWidth + 5, typeTableY + 35, { maxWidth: cellWidth - 10 });
      doc.setFontSize(14);
      if (hasType2) {
        doc.text("X", marginX + cellWidth + 80, typeTableY + 65);
      }
      doc.setFontSize(10);
      doc.text("Machine risque mécanique", marginX + 2 * cellWidth + 5, typeTableY + 35);
      doc.setFontSize(14);
      if (hasType3) {
        doc.text("X", marginX + 2 * cellWidth + 80, typeTableY + 65);
      }
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    
      // 4. CONSIGNATION SECTION
      const consBlockY = marginY + 165; // Below "Sur le site"
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CONSIGNATION", marginX + usableWidth / 2 - 50, consBlockY + 10);
    
      // Static labels for consignation info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Consignation demandée le : ${formatDateTimePDF(consData.date_consignation) || ""}`, marginX + 5, consBlockY + 15);
      doc.text(`Zone concernée : ${consData.zones?.name || ""}`, marginX + 5, consBlockY + 30);
      doc.text(`Équipement concerné : ${consData.equipements || ""}`, marginX + 5, consBlockY + 45);
    
      // CONSIGNATION TABLE
      const tableY = consBlockY + 55;
      const rowHeight = 25;
      const colWidths = [100, 70, 40, 120, 80, 120];
      const colTitles = [
        "Entreprise", "Demandeur", "N° PDP", "Description des travaux",
        "N° de cadenas", "Signature"
      ];
    
      // Draw table header
      let currentX = marginX;
      colTitles.forEach((title, i) => {
        doc.setFont("helvetica", "bold");
        doc.rect(currentX, tableY, colWidths[i], rowHeight, "S");
        doc.text(title, currentX + 2, tableY + 15);
        currentX += colWidths[i];
        console.log("hello**************************")
  
      });
    
      // Determine rows data: if groupedConsignations exists then use it; otherwise, create one row from consData.
      const consignationRows = (groupedConsignations && groupedConsignations.length > 0)
        ? groupedConsignations
        : [consData];
    
      let rowIndex = 1;
      consignationRows.forEach(row => {
      console.log("hello**************************")
      console.log("Drawing row:", row);
  
      currentX = marginX;
        // Enterprise
      doc.setFont("helvetica", "normal");
      doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[0], rowHeight, "S");
      doc.text(row.entreprises?.name || "", currentX + 2, tableY + rowIndex * rowHeight + 15);
      currentX += colWidths[0];
    
        // Demandeur
      doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[1], rowHeight, "S");
      doc.text(row.demandeur?.name || "", currentX + 2, tableY + rowIndex * rowHeight + 15);
      currentX += colWidths[1];
    
        // N° PDP (if available; otherwise leave blank)
      doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[2], rowHeight, "S");
      doc.text(row.pdp || "", currentX + 2, tableY + rowIndex * rowHeight + 15);
      currentX += colWidths[2];
    
        // Description des travaux
        doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[3], rowHeight, "S");
        doc.text(row.description_travaux || "", currentX + 2, tableY + rowIndex * rowHeight + 15, { maxWidth: colWidths[3] - 4 });
        currentX += colWidths[3];
    
        // N° de cadenas
        doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[4], rowHeight, "S");
        doc.text(row.cadenas_num || "", currentX + 2, tableY + rowIndex * rowHeight + 15);
        currentX += colWidths[4];
    
        // Signature: add image if signature_demandeur exists; otherwise leave empty.
        doc.rect(currentX, tableY + rowIndex * rowHeight, colWidths[5], rowHeight, "S");
        if (row.signature_demandeur) {
          doc.addImage(row.signature_demandeur, "PNG", currentX + 2, tableY + rowIndex * rowHeight, colWidths[5] - 4, rowHeight - 4);
        }
        rowIndex++;
      });
    
      // Consignation executed block
  // ── Dynamic “Consignation exécutée” block ──
  const execY = tableY + rowHeight * consignationRows.length + 60;
  const execH = 100;
  doc.rect(marginX, execY, usableWidth, execH, "S");
  
  let ln = execY + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  doc.text(`Consignation exécutée le : ${execConsDate}`, marginX + 5, ln);
  ln += 10;
  doc.text(`• Selon les procédures en vigueur sur le site (${siteName})`, marginX + 5, ln);
  ln += 10;
  doc.text(`• Par : ${executant}`, marginX + 5, ln);
  ln += 10;
  doc.text(`• De l’entreprise utilisatrice : ${userCompany}`, marginX + 5, ln);
  ln += 10;
  doc.text(`• Lockbox : ${lockboxId}`, marginX + 5, ln);
  ln += 10;
  doc.text(
    `• S’engage à faire réaliser la mise en sécurité des différentes énergies et fluides susceptibles de présenter des risques dans le cadre des travaux prévus.`,
    marginX + 5,
    ln,
    { maxWidth: usableWidth - 10 }
  );
  ln += 15;
  doc.text("• Déclarant avoir informé la salle de contrôle", marginX + 5, ln);
  ln += 10;
  doc.setFont("helvetica", "bold");
  doc.text("• Signature de l'exécuteur :", marginX + 5, ln);
  if (signerImg) {
    doc.addImage(signerImg, "PNG", marginX + 140, ln - 8, 80, 40);
  }
  doc.setFontSize(10);
  
      // ------------------------------
      // DÉCONSIGNATION SECTION
      // ------------------------------
      const deconsBlockY = execY + execH + 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("DÉCONSIGNATION", marginX + usableWidth / 2 - 50, deconsBlockY);
    
      // Static labels for deconsignation info (using deconsData, if available)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Déconsignation demandée le : ${deconsData && deconsData.created_at ? formatDateTimePDF(deconsData.created_at) : ""}`,
        marginX + 5,
        deconsBlockY + 15
      );
      
      doc.text(`Zone concernée : ${consData.zones?.name || ""}`, marginX + 5, deconsBlockY + 30);
      doc.text(`Équipement concerné : ${consData.equipements || ""}`, marginX + 5, deconsBlockY + 45);
      doc.setFontSize(9);
      doc.text(
        "Je reconnais qu’à partir de cet instant je ne suis plus protégé dans la zone définie et déclare avoir rassemblé l’ensemble du personnel travaillant dans la zone balisée à l’extérieur du chantier, en avoir fait l’appel nominatif et lui avoir interdit tout retour sur le chantier.",
        marginX + 5,
        deconsBlockY + 60,
        { maxWidth: usableWidth - 10 }    
      );
      doc.text("", marginX + 5, deconsBlockY + 80);
    
      // DÉCONSIGNATION TABLE
      const deconsTableY = deconsBlockY + 95;
      const deconsRowHeight = 25;
      const deconsColWidths = [70, 70, 50, 120, 80, 140];
      const deconsColTitles = [
        "Entreprise",
        "Demandeur",
        "N° PDP",
        "Description des travaux",
        "N° de cadenas",
        "Signature"
      ];
    
      // Draw table header for déconsignation
      currentX = marginX;
      deconsColTitles.forEach((title, i) => {
        doc.setFont("helvetica", "bold");
        doc.rect(currentX, deconsTableY, deconsColWidths[i], deconsRowHeight, "S");
        doc.text(title, currentX + 2, deconsTableY + 15);
        currentX += deconsColWidths[i];
      });
    
      const deconsRows = groupedDeconsData;
     
      rowIndex = 1;
      deconsRows.forEach(row => {
        currentX = marginX;
        doc.setFont("helvetica", "normal");
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[0], deconsRowHeight, "S");
        doc.text(row.entreprises?.name || "", currentX + 2, deconsTableY + rowIndex * deconsRowHeight + 15);
        currentX += deconsColWidths[0];
    
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[1], deconsRowHeight, "S");
        doc.text(row.demandeur?.name || "", currentX + 2, deconsTableY + rowIndex * deconsRowHeight + 15);
        currentX += deconsColWidths[1];
    
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[2], deconsRowHeight, "S");
        doc.text(row.pdp || "", currentX + 2, deconsTableY + rowIndex * deconsRowHeight + 15);
        currentX += deconsColWidths[2];
    
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[3], deconsRowHeight, "S");
        doc.text(row.description_travaux || "", currentX + 2, deconsTableY + rowIndex * deconsRowHeight + 15, { maxWidth: deconsColWidths[3] - 4 });
        currentX += deconsColWidths[3];
    
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[4], deconsRowHeight, "S");
        doc.text(row.cadenas_num || "", currentX + 2, deconsTableY + rowIndex * deconsRowHeight + 15);
        currentX += deconsColWidths[4];
    
        doc.rect(currentX, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[5], deconsRowHeight, "S");
        if (row.signature_demandeur) {
          doc.addImage(row.signature_demandeur, "PNG", currentX + 2, deconsTableY + rowIndex * deconsRowHeight, deconsColWidths[5] - 4, deconsRowHeight - 4);
        }
        rowIndex++;
      });
    
      // Final bottom block for déconsignation execution
  // ── Dynamic “Déconsignation exécutée” block ──
  // ── Dynamic “Déconsignation exécutée” block ──
  const deY = deconsTableY + deconsRowHeight * groupedDeconsData.length + 40;
  const deH = 100;
  doc.rect(marginX, deY, usableWidth, deH, "S");
  
  let ln2 = deY + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  doc.text(`Déconsignation exécutée le : ${execDeconDate}`, marginX + 5, ln2);
  ln2 += 10;
  doc.text("• Selon les procédures en vigueur sur le site", marginX + 5, ln2);
  ln2 += 10;
  doc.text(`• Par : ${executant}`, marginX + 5, ln2);
  ln2 += 10;
  doc.text(`• De l’entreprise utilisatrice : ${userCompany}`, marginX + 5, ln2);
  ln2 += 10;
  doc.text(`• Lockbox : ${lockboxId}`, marginX + 5, ln2);
  ln2 += 10;
  doc.text(
    "• Atteste avoir réalisé une analyse préalable pour définir les modalités de levée de la mise en sécurité.",
    marginX + 5,
    ln2,
    { maxWidth: usableWidth - 10 }
  );
  ln2 += 15;
  doc.text("• Déclarant avoir informé la salle de contrôle", marginX + 5, ln2);
  ln2 += 10;
  doc.setFont("helvetica", "bold");
  doc.text("• Signature de l'exécuteur :", marginX + 5, ln2);
  if (signerImg) {
    doc.addImage(signerImg, "PNG", marginX + 140, ln2 - 8, 80, 40);
  }
  doc.setFontSize(10);
  
    
  
      return doc;
    };



  const handlemultidetails = (id) => {
    console.log("Clicked on row with ID:", id);
    // Navigate to the details page for the clicked row
    navigate(`/consignationdetails/140`);
  }




const handleMultiConsignation = () => {

  if (!consignation.multi_consignation_id) {
  navigate(`/multiconsignation/${consignation.id}`)
  }
  else {
    navigate(`/multiconsignation/${consignation.multi_consignation_id}`)
  }

}














  




// Helper functions for formatting date and time in French.
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR");
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

  
  // Helper functions for date/time formatting.
  // const formatDate = (dateStr) => {
  //   const d = new Date(dateStr);
  //   return d.toLocaleDateString("fr-FR");
  // };
  // const formatTime = (dateStr) => {
  //   const d = new Date(dateStr);
  //   return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
  // };

  const handleGenerateExactCustomPDF = async () => {
    if (!consignation) return;
    let deconsData;
    if (consignation.status === "pending" || consignation.status === "confirmed") {
      deconsData = {
        id: "",
        created_at: "",
        demandeur_id: "",
        entreprise_id: "",
        deconsignateur_id: "",
        consignation_id: "",
        deconsignation_forcee: "",
        deconsignation_forcee_motif: "",
        demandeur: { name: "" },
        deconsignateur: { name: "" },
        entreprise_utilisatrice: { name: "" },
        entreprise_utilisatrice_id: "",
        entreprises: { name: "" },
        signature_deconsignateur: "",
        signature_demandeur: ""
      };
    } else {
      if (consignation.status === "deconsigné" || consignation.status === "archived") {
        const { data, error } = await supabase
          .from("deconsignations")
          .select(`
            *,
            entreprises:entreprises!entreprise_id(name),
            entreprise_utilisatrice:entreprises!deconsignations_entreprise_id_fkey(name),
            demandeur:persons!deconsignations_demandeur_id_fkey(name),
            deconsignateur:persons!deconsignations_deconsignateur_id_fkey(name)
          `)
          .eq("consignation_id", id)
          .single();
        if (error) {
          console.error("Erreur lors de la récupération des détails de déconsignation :", error);
        } else {
          console.log("Données de déconsignation récupérées :", data);
          deconsData = data;
        }
      }
    }
    const doc = generateExactFormPDF(consignation, deconsData, consignationTypes, groupedConsignations, deconsignations);
    doc.save(`formulaire-${id}.pdf`);
  };

  
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Détails de la consignation</h1>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date et heure :</span>
              <span className="text-gray-900">{formatDateTime(consignation.date_consignation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Zone :</span>
              <span className="text-gray-900">{consignation.zones?.name || "pas de valeur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Consignateur :</span>
              <span className="text-gray-900">{consignation.consignateur?.name || "pas de valeur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Entreprise :</span>
              <span className="text-gray-900">{consignation.entreprises?.name || "pas de valeur"}</span>
            </div>
            {/* --- Changed Section: Dynamic Intervenant Rows --- */}
            {console.log("Grouped Consignations:", groupedConsignations)}
             

          
            {/* --- End Changed Section --- */}
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Équipements :</span>
              <span className="text-gray-900">{consignation.equipements || "pas de valeur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Numéro de cadenas :</span>
              <span className="text-gray-900">{consignation.cadenas_num || "pas de valeur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Numéro de LockBox :</span>
              <span className="text-gray-900">{consignation.lockbox || "pas de valeur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Statut :</span>
              <Badge
                className={`px-2 py-1 text-xs ${
                  consignation.status === "pending"
                    ? "bg-gray-200/80 text-black"
                    : consignation.status === "confirmed"
                    ? "bg-green-600/80 text-white"
                    : consignation.status === "deconsigné"
                    ? "bg-red-600/80 text-white"
                    : consignation.status === "planified"
                    ? "bg-sky-500/80 text-white" 
                    : "bg-gray-800/80 text-white"
                }`}
              >
                {statusMapping[consignation.status] || consignation.status}
              </Badge>
            </div>
            {consignation.status === "deconsigné" && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Date de déconsignation :</span>
                <span className="text-gray-900">{formatDateTime(createdAt.created_at)}</span>
              </div>
            )}
            {consignation.status === "pending" && (
              <span className="text-sm font-medium text-gray-900 mx-5">
                La salle de contrôle déclare être informé de la consignation en cours
              </span>
            )}
          </div>

          <div className="flex justify-between mt-5">
            <button
              type="button"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-500 transition active:bg-indigo-800"
              onClick={() => navigate(-1)}
            >
              Retour à la liste
            </button>

            {consignation.status === "pending" ? (
              <button
                type="button"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-500 transition active:bg-green-800"
                onClick={openPasswordModal}
              >
                Confirmer
              </button>
            ) : consignation.status === "confirmed" ? (
              <Link to={`/deconsignation/${id}`}>
                <button
                  type="button"
                  className="inline-block bg-red-600 text-white px-6 py-2 rounded hover:bg-red-500 transition active:bg-red-800"
                >
                  Déconsigner
                </button>
              </Link>
            ) : consignation.status === "deconsigné" ? (
              <button
                type="button"
                className="inline-block bg-fuchsia-600 text-white px-6 py-2 rounded hover:bg-fuchsia-500 transition active:bg-fuchsia-800"
                onClick={() =>
                  handleConfirmationDeconsignation(consignation.id, consignation.status)
                }
              >
                Confirmer la déconsignation
              </button>
            ) : consignation.status === "planified" ? (
              <button
                type="button"
                className="inline-block bg-sky-600 text-white px-6 py-2 rounded hover:bg-sky-500 transition active:bg-blue-800"
                onClick={() =>
                  handleContinuationConsignation(consignation.id, consignation.status)
                }
              >
                Continue la consignation
              </button>
            ) : (
              <button
                type="button"
                className="inline-block bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-500 transition active:bg-gray-800"
                disabled
              >
                Archivée
              </button>
            )}
          </div>

          <div className="mt-5">
            <button
              type="button"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 transition active:bg-blue-800"
              onClick={handleGenerateExactCustomPDF}
            >
              Imprimer le PDF final
            </button>
          </div>
          <div className="mt-5">
            <button
              type="button"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 transition active:bg-blue-800"
              onClick={handleMultiConsignation}
            >
              Ajoute une consignation multiple
            </button>
          </div>
        </div>
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl mb-4">Veuillez entrer le mot de passe</h2>
            <input
              type="password"
              className="border p-2 w-full mb-2"
              placeholder="Mot de passe"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
            <div className="flex justify-end">
              <button
                className="mr-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowPasswordModal(false)}
              >
                Annuler
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
                onClick={handlePasswordConfirm}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsignationDetails;
