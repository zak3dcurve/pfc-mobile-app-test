import React, { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { supabase } from "@/features/auth/utils/supabase-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SignaturePad from "signature_pad";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";

const ConsignationArchivesPage = () => {
  const [consignations, setConsignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState("");

  const navigate = useNavigate();

  const statusMapping = {
    archived: "Archivée",
    
  };

  /* realtime************************************************************************************************************************************ */



const allowedStatuses = ['pending', 'confirmed', 'deconsigné'];

const fetchSingleConsignation = async (id) => {
  const { data, error } = await supabase
    .from("consignations")
    .select(`
      *,
      entreprises:entreprises!entreprise_id(name),
      entreprise_utilisatrice:entreprises!entreprise_utilisatrice_id(name),
      demandeur:persons!consignations_demandeur_id_fkey(name),
      zones(name),
      consignation_types_junction (
        types_consignation (type_name)
      )
    `)
    .eq("id", id)
    .eq("status", "archived")
    .maybeSingle();

  if (error) {
    console.error("Erreur lors de la récupération de la consignation:", error);
    return null;
  }
  return data;
};

useEffect(() => {
  const channel = supabase
    .channel("table-db-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "consignations" },
      async (payload) => {
        console.log("Nouvelle consignation détectée :", payload.new);
        const newConsignation = await fetchSingleConsignation(payload.new.id);
        if (newConsignation) {
          setConsignations((prev) => [newConsignation, ...prev]);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "consignations" },
      async (payload) => {
        console.log("Consignation mise à jour :", payload.new);
        const updatedConsignation = await fetchSingleConsignation(payload.new.id);
        if (updatedConsignation) {
          setConsignations((prev) => {
            const index = prev.findIndex(item => item.id === payload.new.id);
            if (index > -1) {
              // Update the existing record
              return prev.map(item =>
                item.id === payload.new.id ? updatedConsignation : item
              );
            } else {
              // Add the record if it wasn't already in the list
              return [updatedConsignation, ...prev];
            }
          });
        } else {
          // Remove the record if its status no longer matches "archived"
          setConsignations((prev) =>
            prev.filter((item) => item.id !== payload.new.id)
          );
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "consignations" },
      (payload) => {
        console.log("Consignation supprimée :", payload.old);
        setConsignations((prev) => prev.filter((item) => item.id !== payload.old.id));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);




/* realtime************************************************************************************************************************************ */















  

  const fetchConsignations = async () => {
    const { data, error } = await supabase
      .from("consignations")
      .select(`
        *,
        entreprises:entreprises!entreprise_id(name),
        entreprise_utilisatrice:entreprises!entreprise_utilisatrice_id(name),
        demandeur:persons!consignations_demandeur_id_fkey(name),
        zones(name),
        consignation_types_junction (
          types_consignation (type_name)
        )
      `)
      .eq("status", "archived")
      // Order by date_consignation descending (most recent first)
      .order("date_consignation", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des consignations :", error);
    } else {
      setConsignations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConsignations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-200">
        <div className="flex items-center gap-2">
          <LoadingSpinner /> <h4>Chargement...</h4>
        </div>
      </div>
    );
  }

  // Define DataTable columns with French date formatting
  const columns = [
    {
      name: "Date et heure",
      selector: (row) => {
        if (row.date_consignation) {
          const d = new Date(row.date_consignation);
          return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`;
        }
        return "N/A";
      },
      sortable: true,
    },
    {
      name: "Zone",
      selector: (row) => (row.zones && row.zones.name ? row.zones.name : "N/A"),
      sortable: true,
    },
    {
      name: "Équipements",
      selector: (row) => row.equipements || "N/A",
      sortable: true,
    },
    {
      name: "Entreprise",
      selector: (row) =>
        row.entreprises && row.entreprises.name ? row.entreprises.name : "N/A",
      sortable: true,
      cell: (row) => (
        <Badge className="px-2 py-1 text-xs bg-gray-600 text-white">
          {row.entreprises.name}
        </Badge>
      ),
    },
    {
      name: "Intervenant",
      selector: (row) =>
        row.demandeur && row.demandeur.name ? row.demandeur.name : "N/A",
      sortable: true,
    },
    {
      name: "Statut",
      selector: (row) => row.status || "N/A",
      sortable: true,
      cell: (row) => (
        <Badge
          className={`px-2 py-1 text-xs ${
            row.status === "pending"
              ? "bg-gray-200/80 text-black"
              : row.status === "confirmed"
              ? "bg-green-600/80 text-white"
              : row.status === "deconsigné"
              ? "bg-red-600/80 text-white"
              : "bg-gray-800/80 text-white"
          }`}
        >
          {statusMapping[row.status] || row.status}
        </Badge>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#1b2631",
      },
    },
    headCells: {
      style: {
        color: "#fff",
        fontSize: "14px",
      },
    },
    rows: {
      style: {
        cursor: "pointer",
        transition: "background-color 0.3s",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        fontWeight: "500",
        color: "#000",
      },
    },
  };

  const conditionalRowStyles = [
    {
      when: (row) => row.status === "archived",
      style: {
        backgroundColor: "rgb(218, 218, 218)",
        color: "#000",
        "&:hover": {
          backgroundColor: "rgb(235, 235, 235)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(131, 131, 131, 0.75)",
          color: "#000",
        },
      },
    },
  ];

  const handleRowClick = (row) => {
    console.log(row.status);
    setSelectedRow(row);
    navigate(`/consignationdetails/${row.id}`);
  };

  return (
    <>
      <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Consignations Archivées
            </h1>

            <div>
              <Link to="/consignationList">
                <button
                  type="button"
                  className="rounded-md bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-fuchsia-500 active:bg-fuchsia-800 transition-colors"
                >
                  Consignations Actives
                </button>
              </Link>
              <Link to="/consignation">
                <button
                  type="button"
                  className="ml-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors"
                >
                  Ajouter une consignation
                </button>
              </Link>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={consignations}
            customStyles={customStyles}
            fixedHeader
            fixedHeaderScrollHeight="400px"
            conditionalRowStyles={conditionalRowStyles}
            onRowClicked={handleRowClick}
            pointerOnHover
          />
        </div>
      </div>
    </>
  );
};

export default ConsignationArchivesPage;
