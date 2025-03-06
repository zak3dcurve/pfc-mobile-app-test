// generateConsignationPDF.js
import jsPDF from "jspdf";

export const generateConsignationPDF = (consignationData) => {
  const {
    date_consignation,
    designation_travaux,
    equipements,
    cadenas_num,
    lockbox,
    signature_consignateur,
    signature_demandeur,
    // etc. – add all the fields you need
  } = consignationData;

  // 1. Initialize jsPDF (portrait orientation, points unit, A4 page)
  const doc = new jsPDF("p", "pt", "a4");

  // 2. Set some styling
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  // 3. Add a title (x=40, y=40 offset from top-left)
  doc.text("ATTESTATION DE CONSIGNATION", 40, 40);

  // 4. Add subheadings or lines
  doc.setFontSize(10);
  doc.text(`Date de Consignation: ${date_consignation || "N/A"}`, 40, 60);
  doc.text(`Désignation des Travaux: ${designation_travaux || "N/A"}`, 40, 75);
  doc.text(`Équipements: ${equipements || "N/A"}`, 40, 90);
  doc.text(`Cadenas num: ${cadenas_num || "N/A"}`, 40, 105);
  doc.text(`Lockbox: ${lockbox || "N/A"}`, 40, 120);

  // 5. Add signature images if they exist (jsPDF addImage: addImage(imageData, format, x, y, width, height))
  //    'format' is often "PNG" or "JPEG". If your signature dataURL starts with "data:image/png", then use "PNG".
  let currentY = 150;
  if (signature_consignateur) {
    doc.text("Signature Consignateur:", 40, currentY);
    doc.addImage(signature_consignateur, "PNG", 200, currentY - 15, 100, 50);
    currentY += 70; // move down to make space for the next signature
  }

  if (signature_demandeur) {
    doc.text("Signature Demandeur:", 40, currentY);
    doc.addImage(signature_demandeur, "PNG", 200, currentY - 15, 100, 50);
    currentY += 70;
  }

  // 6. Add more sections (like "Validation", "Fin de travaux") as needed
  // doc.text("Fin de Travaux:", 40, currentY);
  // ...

  // 7. Save or return the PDF
  // doc.save("consignation.pdf");
  // OR return the data URI so you can open in a new tab or do something else
  return doc;
};
