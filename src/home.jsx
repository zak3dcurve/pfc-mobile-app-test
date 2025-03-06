import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Navbar from "@/components/app-navbar";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";

const ConsignationList = () => {
  const [consignations, setConsignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();





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
    .in("status", allowedStatuses)
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
          setConsignations((prev) =>
            prev.map((item) => (item.id === payload.new.id ? updatedConsignation : item))
          );
        } else {
          // Remove the record if its status no longer matches allowedStatuses
          setConsignations((prev) => prev.filter((item) => item.id !== payload.new.id));
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
















  // Fetch consignations ordered by date_consignation descending and filtered by status
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
      .order("date_consignation", { ascending: false })
      .in("status", ["pending", "confirmed", "deconsigné"]);

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

  // Common columns for both tables
  const columns = [
    {
      name: "Date et heure",
      selector: (row) =>
        row.date_consignation
          ? (() => {
              const date = new Date(row.date_consignation);
              return `${date.toLocaleDateString("fr-FR")} ${date.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}`;
            })()
          : "N/A",
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
      cell: (row) => {
        const statusMapping = {
          pending: "En attente",
          confirmed: "Consigné",
          "deconsigné": "Déconsigné",
        };
        return (
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
        );
      },
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
  };

  const conditionalRowStyles = [
    {
      when: (row) => row.status === "confirmed",
      style: {
        backgroundColor: "rgba(37, 201, 45, 0.27)",
        "&:hover": {
          backgroundColor: "rgba(0, 255, 13, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(2, 100, 17, 0.27)",
          color: "#000",
        },
      },
    },
    {
      when: (row) => row.status === "deconsigné",
      style: {
        backgroundColor: "rgba(201, 37, 37, 0.27)",
        "&:hover": {
          backgroundColor: "rgba(255, 0, 0, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(100, 2, 2, 0.27)",
          color: "#000",
        },
      },
    },
    {
      when: (row) => row.status === "pending",
      style: {
        backgroundColor: "rgba(255, 255, 255, 0.27)",
        "&:hover": {
          backgroundColor: "rgba(209, 209, 209, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(73, 73, 73, 0.27)",
          color: "#000",
        },
      },
    },
  ];

  // Row click handler for the Consignations table
  const handleRowClickConsignations = (row) => {
    navigate(`/consignationdetails/${row.id}`);
  };

  // Empty data for Permis de Feu table
  const permisData = [];

  return (
    <>
      <Navbar />

      {/* Outer container */}
      <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto mt-20 mb-10">
          {/* Consignations Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
                Consignations
              </h1>
              <div>
                <Link to="/consignationarchives">
                  <button
                    type="button"
                    className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-500 active:bg-gray-800 transition-colors"
                  >
                    Archives
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

            {/* Legend */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-800">Consigné</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white rounded-full mr-2 border border-gray-600"></div>
                <span className="text-sm text-gray-800">En attente</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-600 rounded-full mr-2 border border-red-600"></div>
                <span className="text-sm text-gray-800">Déconsigné</span>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={consignations}
              customStyles={customStyles}
              fixedHeader
              fixedHeaderScrollHeight="400px"
              conditionalRowStyles={conditionalRowStyles}
              onRowClicked={handleRowClickConsignations}
              highlightOnHover
              pointerOnHover
              noDataComponent={
                <div className="p-4 text-center">Aucun enregistrement à afficher</div>
              }
            />
          </div>

          {/* Permis de Feu Card (Empty and Disabled) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Permis de Feu
              </h1>
              <button
                type="button"
                disabled
                className="ml-4 rounded-md bg-gray-500 px-4 py-2 text-sm font-semibold text-white shadow cursor-not-allowed"
              >
                Ajouter un permis de feu
              </button>
            </div>
            <DataTable
              columns={columns}
              data={permisData}
              customStyles={customStyles}
              fixedHeader
              fixedHeaderScrollHeight="400px"
              conditionalRowStyles={conditionalRowStyles}
              highlightOnHover
              pointerOnHover
              noDataComponent={
                <div className="p-4 text-center">Aucun enregistrement à afficher</div>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsignationList;
