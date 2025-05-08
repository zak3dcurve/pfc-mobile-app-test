import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { supabase } from "@/features/auth/utils/supabase-client";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Link, useNavigate } from "react-router-dom";
import StatutTimer from "../components/StatutTimer";

const PermisDeFeuList = () => {
  const [permis, setPermis] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [rowsWithTimers, setRowsWithTimers] = useState([]);


  // Fetch records from the permis_de_feu table, with joins to retrieve "nom responsable" and "zone"
  const fetchPermis = async () => {
    setLoading(true);
  
    const { data: permisData, error: permisError } = await supabase
      .from("permis_de_feu")
      .select(`
        *,
        responsables:persons!resp_surveillance_id(name),
        zones:zones!lieu_id(name)
      `)
      .order("created_at", { ascending: false });
  
    if (permisError || !permisData) {
      console.error("Error fetching permis:", permisError);
      setLoading(false);
      return;
    }
  
    const { data: timers, error: timerError } = await supabase
      .from("timer_end")
      .select("pdf_id, timer_15min, timer_2h, timer_dejeuner_15min");
  
    if (timerError) {
      console.error("Error fetching timers:", timerError);
      setPermis(permisData);
      setLoading(false);
      return;
    }
  
    // Merge timer timestamps into rows
    const merged = permisData.map(row => {
      const timerRow = timers.find(t => t.pdf_id === row.id);
      return {
        ...row,
        timer_15min: timerRow?.timer_15min,
        timer_2h: timerRow?.timer_2h,
        timer_dejeuner_15min: timerRow?.timer_dejeuner_15min,
      };
    });
  
    setRowsWithTimers(merged.map(row => ({
  ...row,
  remaining_15min: row.timer_15min ? new Date(row.timer_15min).getTime() - Date.now() : null,
  remaining_2h: row.timer_2h ? new Date(row.timer_2h).getTime() - Date.now() : null,
  remaining_dej: row.timer_dejeuner_15min ? new Date(row.timer_dejeuner_15min).getTime() - Date.now() : null,
})));
    setLoading(false);
  };
  

  useEffect(() => {
    fetchPermis();
  }, []);


const isRowCritical = (row) => {
  const t1 = getRemainingStatus(row?.timer_15min);
  const t2 = getRemainingStatus(row?.timer_2h);
  const t3 = getRemainingStatus(row?.timer_dejeuner_15min);

  return (
    (t1 && t1 <= 300000) ||
    (t2 && t2 <= 300000) ||
    (t3 && t3 <= 300000)
  );
};

  const conditionalRowStyles = [
    {
      when: row => row.isCritical === true,
      style: {
        backgroundColor: "#ffe5e5",
        color: "#b00000",
      },
    },
  ];
  

  // DataTable column definitions:
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
      selector: (row) =>
        row.zones && row.zones.name ? row.zones.name : "N/A",
      sortable: true,
    },
    {
      name: "Nom responsable",
      selector: (row) =>
        row.responsables && row.responsables.name ? row.responsables.name : "N/A",
      sortable: true,
    },
    {
      name: "Statut",
      cell: row => <StatutTimer row={row} />,
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

  const handleRowClick = (row) => {
    // Navigate to detail page if needed
    navigate(`/permisdefeudetails/${row.id}`);
  };

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
    <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      {/* Card container */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Permis de Feu
          </h1>
          <div>
            
            <Link to="/permisdefeu">
              <button
                type="button"
                className="ml-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors"
              >
                Ajouter un permis de feu
              </button>
            </Link>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={permis}
          customStyles={customStyles}
          fixedHeader
          fixedHeaderScrollHeight="400px"
          onRowClicked={handleRowClick}
          highlightOnHover
          pointerOnHover
          conditionalRowStyles={conditionalRowStyles}  // 🔴 Highlight critical rows

          noDataComponent={
            <div className="p-4 text-center">Aucun enregistrement à afficher</div>
          }
        />
      </div>
    </div>
  );
};

export default PermisDeFeuList;
