import React, { useEffect, useState, useRef } from "react";
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
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import notificationSound from "@/assets/notification.mp3";
import { useIsMobile } from "@/hooks/use-mobile";

const ConsignationList = () => {
  const [consignations, setConsignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const notificationAudio = useRef(new Audio(notificationSound));

  // Allowed statuses for realtime and listing
  const allowedStatuses = ['pending', 'confirmed', 'deconsigné'];

  // Fetch a single consignation record by id (for realtime updates)
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

  // Realtime subscription for inserts, updates, deletes
  useEffect(() => {
    const unlockAudio = () => {
      if (notificationAudio.current) {
        notificationAudio.current
          .play()
          .then(() => {
            notificationAudio.current.pause();
            notificationAudio.current.currentTime = 0;
            console.log("Audio context unlocked");
          })
          .catch((error) => {
            console.error("Error unlocking audio context", error);
          });
      }
    };

    document.addEventListener("click", unlockAudio, { once: true });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("table-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consignations" },
        async (payload) => {
          console.log("Nouvelle consignation détectée :", payload.new);
          try {
            await notificationAudio.current.play();
          } catch (error) {
            console.error("Error playing notification sound:", error);
          }
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
          try {
            await notificationAudio.current.play();
          } catch (error) {
            console.error("Error playing notification sound:", error);
          }
          if (updatedConsignation) {
            setConsignations((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? updatedConsignation : item
              )
            );
          } else {
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
          try {
            notificationAudio.current.play();
          } catch (error) {
            console.error("Error playing notification sound:", error);
          }
          setConsignations((prev) =>
            prev.filter((item) => item.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch all consignations with their relations
  const fetchConsignations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("consignations")
      .select(`
        *,
        entreprises:entreprises!entreprise_id(name),
        entreprise_utilisatrice:entreprises!entreprise_utilisatrice_id(name),
        consignateur:persons!consignations_consignateur_id_fkey(name),
        demandeur:persons!consignations_demandeur_id_fkey(name),
        zones(name),
        consignation_types_junction (
          types_consignation (type_name)
        )
      `)
      .in("status", ["pending", "confirmed", "deconsigné"])
      .order("date_consignation", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des consignations :", error);
    } else {
      // Group records by multi_consignation_id
      const grouped = groupConsignations(data);
      setConsignations(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConsignations();
  }, []);

  // Helper: Group consignations by multi_consignation_id
  const groupConsignations = (data) => {
    const grouped = [];
    const multiGroups = {};

    data.forEach((cons) => {
      if (cons.multi_consignation_id &&  ["confirmed", "pending"].includes(cons.status)      ) {
        if (!multiGroups[cons.multi_consignation_id]) {
          multiGroups[cons.multi_consignation_id] = { ...cons, count: 1 };
        } else {
          multiGroups[cons.multi_consignation_id].count += 1;
        }
      } else {
        grouped.push(cons);
      }
    });

    // Add grouped multi consignations to array
    Object.values(multiGroups).forEach((group) => {
      grouped.push(group);
    });
    return grouped;
  };

  const statusMapping = {
    pending: "En attente",
    confirmed: "Consigné",
    "deconsigné": "Déconsigné",
  };

  // DataTable columns, with an extra column to indicate multi‑consignation groups
  const columns = [
    {
      name: "   ",
      selector: (row) =>
        (row.multi_consignation_id && ["pending", "confirmed"].includes(row.status) )? (
          <span title="Consignation multiple" style={{ fontSize: "1.2rem", color: "#4caf50" }}>
          </span>
        ) : null,
      sortable: false,
      width: "20px",
    },
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
      selector: (row) => (row.zones && row.zones.name ? row.zones.name : "non-défini"),
      sortable: true,
    },
    {
      name: "Consignateur",
      selector: (row) =>
        row.consignateur && row.consignateur.name ? row.consignateur.name : "non-défini",
      sortable: true,
    },
    {
      name: "Intervenant",
      selector: (row) =>
        row.demandeur && row.demandeur.name ? row.demandeur.name : "non-défini",
      sortable: true,
    },
    {
          name: "Entreprise",
          selector: (row) => row.entreprises?.name || "non-défini",
          cell: (row) =>
            row.multi_consignation_id &&
            ["pending", "confirmed"].includes(row.status) ? (
              <span
                title="Consignation multiple"
                style={{ fontSize: "1.2rem", color: "#4caf50" }}
              >
                &#128101;
              </span>
            ) : (
              <Badge className="px-2 py-1 text-xs bg-gray-600 text-white">
                {row.entreprises?.name}
              </Badge>
            ),
          sortable: true,
        },
    {
      name: "Statut",
      selector: (row) => row.status || "non-défini",
      sortable: true,
      cell: (row) => (
        <Badge
          className={`px-2 py-1 text-xs ${
            row.status === "pending"
              ? "bg-orange-600/80 text-white"
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
        backgroundColor: "rgba(255, 174, 0, 0.27)",
        "&:hover": {
          backgroundColor: "rgba(255, 187, 0, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(255, 123, 0, 0.27)",
          color: "#000",
        },
      },
    },

    {
      when: (row) => (row.multi_consignation_id && row.status === ("pending" )),
      style: {
        backgroundColor: "#f7faff",
    borderLeft: "4px solid #001f54",
    color: "#001f54",
    fontWeight: "600",
    fontFamily: "Segoe UI, Roboto, sans-serif",
        "&:hover": {
          backgroundColor: "rgba(255, 187, 0, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(255, 123, 0, 0.27)",
          color: "#000",
        },
      },
    },

    {
      when: (row) => (row.multi_consignation_id && row.status === ("confirmed")),
      style: {
        backgroundColor: "#f7faff",
    borderLeft: "4px solid #001f54",
    color: "#001f54",
    fontWeight: "600",
    fontFamily: "Segoe UI, Roboto, sans-serif",
        "&:hover": {
          backgroundColor: "rgba(30, 255, 0, 0.27)",
          color: "#000",
        },
        "&:active": {
          backgroundColor: "rgba(0, 255, 42, 0.27)",
          color: "#000",
        },
      },
    }
    

  ];

  const handleRowClick = (row) => {
    console.log(row.status);
    setSelectedRow(row);
    // If this is a grouped (multiple) record then navigate to the multi details page.
    if (row.multi_consignation_id && ( row.status === "pending" || row.status === "confirmed" ) ) {
      navigate(`/multiconsdetails/${row.multi_consignation_id}`);
    } else {
      navigate(`/consignationdetails/${row.id}`);
    }
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
    <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className={`font-bold text-gray-800 mb-4 sm:mb-0 ${
              isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'
            }`}>
              Consignations
            </h1>
            <div className={`flex gap-2 ${
              isMobile ? 'flex-col w-full' : 'flex-row'
            }`}>
              <Link to="/consignationarchives" className={isMobile ? 'w-full' : ''}>
                <button
                  type="button"
                  className={`rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-500 active:bg-gray-800 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Archives
                </button>
              </Link>
              <Link to="/consignation" className={isMobile ? 'w-full' : ''}>
                <button
                  type="button"
                  className={`rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors ${
                    isMobile ? 'w-full h-12' : ''
                  }`}
                >
                  Ajouter une consignation
                </button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-800">Consigné</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2 "></div>
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
            fixedHeaderScrollHeight={isMobile ? "60vh" : "400px"}
            conditionalRowStyles={conditionalRowStyles}
            onRowClicked={handleRowClick}
            highlightOnHover
            pointerOnHover
            responsive={true}
            dense={isMobile}
            pagination={true}
            paginationPerPage={isMobile ? 10 : 20}
            paginationRowsPerPageOptions={isMobile ? [5, 10, 15] : [10, 20, 30, 50]}
            noDataComponent={
              <div className="p-4 text-center">Aucun enregistrement à afficher</div>
            }
          />
        </div>
      </div>
  );
};

export default ConsignationList;
