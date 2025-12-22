// pages/PermisDeFeuList.jsx
import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { supabase } from "@/features/auth/utils/supabase-client";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Link, useNavigate } from "react-router-dom";
import StatutTimer from "../components/StatutTimer";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateRowStatus } from "../utils/Statuscalculator";

const PermisDeFeuList = () => {
  const [loading, setLoading] = useState(true);
  const [rowsWithStatus, setRowsWithStatus] = useState([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchPermis = async () => {
    setLoading(true);

    // 1. Fetch Permis de feu
    const { data: permisData, error: permisError } = await supabase
      .from("permis_de_feu")
      .select(`
        *,
        responsables:persons!resp_surveillance_id(name),
        zones:zones!lieu_id(name)
      `)
      .not("status", "in", "(planified,archived)")
      .order("created_at", { ascending: false });

    if (permisError || !permisData) {
      console.error("Error fetching permis:", permisError);
      setLoading(false);
      return;
    }

    // 2. Fetch ALL timer data (timestamps AND boolean fields)
const { data: timers, error: timerError } = await supabase
  .from("timer_end")
  .select("pdf_id, timer_15min, timer_2h, timer_dejeuner_15min, fin_pause, form_15min, form_15min_dejeuner, form_2h");

    if (timerError) {
      console.error("Error fetching timers:", timerError);
      // Continue with permis data even if timers fail
      const merged = permisData.map((row) => ({
        ...row,
        statusAlgo: "en_cours",
      }));
      setRowsWithStatus(merged);
      setLoading(false);
      return;
    }

    // 3. Merge data and calculate status IMMEDIATELY (before rendering)
    const merged = permisData.map((row) => {
      const timerRow = timers?.find((t) => t.pdf_id === row.id);
      
      // Combine all data from both tables
      const fullRowData = {
        ...row,
        // Spread all timer data (timestamps and boolean flags)
        ...(timerRow || {}),
      };

      // Calculate status NOW - no waiting for UI
      const statusAlgo = calculateRowStatus(fullRowData);

      return {
        ...fullRowData,
        statusAlgo: statusAlgo,
      };
    });

    setRowsWithStatus(merged);
    setLoading(false); // Loading ends when everything is calculated
  };

  useEffect(() => {
    fetchPermis();
  }, []);

  // Highlight rows that need attention
  const conditionalRowStyles = [
    {
      when: (row) => row.statusAlgo === "attente_form_final",
      style: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        "&:hover": { backgroundColor: "#fecaca" },
      },
    },
    {
      when: (row) => row.statusAlgo === "attente_form_15min",
      style: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        "&:hover": { backgroundColor: "#fde68a" },
      },
    },
    {
      when: (row) => row.statusAlgo === "attente_form_dejeuner",
      style: {
        backgroundColor: "#fed7aa",
        color: "#9a3412",
        "&:hover": { backgroundColor: "#fdba74" },
      },
    },
  ];

  // Table columns
  const columns = [
    {
      name: "Heure de début",
      selector: (row) =>
        row.heure_debut
          ? new Date(row.heure_debut).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "N/A",
      sortable: true,
    },
    {
      name: "Heure de fin",
      selector: (row) =>
        row.heure_fin
          ? new Date(row.heure_fin).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "N/A",
      sortable: true,
    },
    {
      name: "Lieu",
      selector: (row) => row.zones?.name || "N/A",
      sortable: true,
    },
    {
      name: "Nom responsable",
      selector: (row) => row.responsables?.name || "N/A",
      sortable: true,
    },
    {
      name: "Statut",
      cell: (row) => <StatutTimer row={row} initialStatus={row.statusAlgo} />,
      sortable: false,
    },
    {
      name: "Type",
      selector: () => "permis de feu",
      cell: () => (
        <Badge className="px-2 py-1 text-xs bg-blue-600 text-white">
          permis de feu
        </Badge>
      ),
      sortable: false,
    },
  ];

  // Table styling
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
        transition: "background-color 0.2s ease",
        "&:active": {
          backgroundColor: "#fca5a5",
        },
      },
    },
  };

  const handleRowClick = (row) => {
    navigate(`/permisdefeudetails/${row.id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-200">
        <div className="flex items-center gap-2">
          <LoadingSpinner /> <h4>Chargement...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-20">
      {/* Card container */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1
            className={`font-bold text-gray-800 mb-4 sm:mb-0 ${
              isMobile ? "text-xl" : "text-2xl sm:text-3xl"
            }`}
          >
            Permis de Feu
          </h1>
          <div
            className={`flex gap-2 ${
              isMobile ? "flex-col w-full" : "flex-row"
            }`}
          >
            <Link to="/multiconsarch" className={isMobile ? "w-full" : ""}>
              <button
                type="button"
                className={`rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-500 active:bg-gray-800 transition-colors ${
                  isMobile ? "w-full h-12" : ""
                }`}
              >
                Archives
              </button>
            </Link>
            <Link to="/permisdefeu" className={isMobile ? "w-full" : ""}>
              <button
                type="button"
                className={`rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors ${
                  isMobile ? "w-full h-12" : ""
                }`}
              >
                Ajouter un permis de feu
              </button>
            </Link>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={rowsWithStatus}
          customStyles={customStyles}
          fixedHeader
          fixedHeaderScrollHeight={isMobile ? "60vh" : "400px"}
          onRowClicked={handleRowClick}
          highlightOnHover
          pointerOnHover
          conditionalRowStyles={conditionalRowStyles}
          responsive={true}
          dense={isMobile}
          pagination={true}
          paginationPerPage={isMobile ? 10 : 20}
          paginationRowsPerPageOptions={
            isMobile ? [5, 10, 15] : [10, 20, 30, 50]
          }
          noDataComponent={
            <div className="p-6 text-center text-gray-500">
              <div className="text-lg mb-2">📋</div>
              <p>Aucun enregistrement à afficher</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default PermisDeFeuList;