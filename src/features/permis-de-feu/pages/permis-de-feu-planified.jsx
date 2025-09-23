import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { supabase } from "@/features/auth/utils/supabase-client";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const PermisDeFeuPlanified = () => {
  const [permis, setPermis] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch records from the permis_de_feu table with status "planified"
  useEffect(() => {
    const fetchPlanifiedPermis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("permis_de_feu")
          .select(`
            id,
            created_at,
            heure_debut,
            heure_fin,
            operation_description,
            responsables:persons!resp_surveillance_id(name),
            zones:zones!lieu_id(name)
          `)
          .eq("status", "planified")
          .order("created_at", { ascending: false });

        // FIX: Throw an error if the request fails
        if (error) {
          throw error;
        }

        // Set data (or an empty array if data is null)
        setPermis(data || []);

      } catch (error) {
        console.error("Error fetching planned permits:", error);
        // Here you could also set an error state to show a message to the user
      } finally {
        // Ensures the loading spinner is hidden after the request completes or fails
        setLoading(false);
      }
    };

    fetchPlanifiedPermis();
  }, []); // Empty dependency array ensures this runs only once on mount

  // DataTable column definitions:
  const columns = [
    {
      name: "Date de création",
      selector: (row) => row.created_at, // Selector can now directly return the date object
      sortable: true,
      format: (row) =>
        new Date(row.created_at).toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      name: "Heure de début",
      selector: (row) => row.heure_debut,
      sortable: true,
      format: (row) =>
        row.heure_debut
          ? new Date(row.heure_debut).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Non définie",
    },
    {
      name: "Heure de fin",
      selector: (row) => row.heure_fin,
      sortable: true,
      format: (row) =>
        row.heure_fin
          ? new Date(row.heure_fin).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Non définie",
    },
    {
      name: "Lieu",
      selector: (row) => (row.zones?.name ? row.zones.name : "Non défini"),
      sortable: true,
    },
    {
      name: "Nom responsable",
      selector: (row) => (row.responsables?.name ? row.responsables.name : "Non défini"),
      sortable: true,
    },
    {
      name: "Description",
      selector: (row) => row.operation_description || "Non définie",
      cell: (row) => (
        <div className="truncate max-w-xs" title={row.operation_description || "Non définie"}>
          {row.operation_description || "Non définie"}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Statut",
      cell: () => (
        <Badge className="px-2 py-1 text-xs bg-orange-600 text-white">
          Planifié
        </Badge>
      ),
      sortable: false,
    },
    {
      name: "Type",
      // FIX: Removed the redundant `selector` property for a static column
      cell: () => (
        <Badge className="px-2 py-1 text-xs bg-blue-600 text-white">
          Permis de Feu
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
      highlightOnHoverStyle: {
        backgroundColor: "#f5f5f5",
      },
    },
  };

  const handleRowClick = (row) => {
    // Navigate to edit page for planned permits
    navigate(`/permisdefeu/edit/${row.id}`);
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
    <div className="bg-gray-200 flex items-center justify-center min-h-screen px-2 sm:px-4 lg:px-8 pt-20">
        {/* Card container */}
        <div className={`bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto mt-4 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
          <div className={`flex justify-between items-center mb-6 ${
              isMobile ? 'flex-col space-y-4' : 'flex-row'
            }`}>
            <h1 className={`font-bold text-gray-800 ${
                isMobile ? 'text-xl text-center order-1' : 'text-2xl sm:text-3xl'
              }`}>
              Permis de Feu Planifiés
            </h1>
            <div className={`flex gap-2 ${
                isMobile ? 'flex-col w-full order-2' : 'flex-row'
              }`}>
              <Link to="/permisdefeu" className={isMobile ? 'w-full order-1' : ''}>
                <button
                  type="button"
                  className={`rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Ajouter un permis de feu
                </button>
              </Link>
              <Link to="/listpermisdefeu" className={isMobile ? 'w-full order-2' : ''}>
                <button
                  type="button"
                  className={`rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 active:bg-blue-800 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Permis Actifs
                </button>
              </Link>
              <Link to="/multiconsarch" className={isMobile ? 'w-full order-3' : ''}>
                <button
                  type="button"
                  className={`rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-500 active:bg-gray-800 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Archives
                </button>
              </Link>
            </div>
          </div>

          {/* Info banner */}
          <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Ces permis sont en état de planification. Ils peuvent être incomplets et nécessitent une validation avant activation.
                </p>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={permis}
            customStyles={customStyles}
            fixedHeader
            fixedHeaderScrollHeight={isMobile ? "60vh" : "400px"}
            onRowClicked={handleRowClick}
            highlightOnHover
            pointerOnHover
            responsive={true}
            dense={isMobile}
            pagination={true}
            paginationPerPage={isMobile ? 10 : 20}
            paginationRowsPerPageOptions={isMobile ? [5, 10, 15] : [10, 20, 30, 50]}
            noDataComponent={
              <div className="p-4 text-center">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun permis planifié</h3>
                  <p className="text-gray-500">Il n'y a actuellement aucun permis de feu en état de planification.</p>
                </div>
              </div>
            }
          />
        </div>
      </div>
  );
};

export default PermisDeFeuPlanified;