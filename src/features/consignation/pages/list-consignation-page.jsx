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
import notificationSound from "@/assets/notification.mp3";


const ConsignationList = () => {
  const [consignations, setConsignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sigPadResponsable = useRef(null);
  const signaturePadResponsable = useRef(null);

  const navigate = useNavigate();

  const notificationAudio = useRef(new Audio(notificationSound));






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

  // Add a one-time event listener for a dedicated unlock button click
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
        try {
         notificationAudio.current.play();
        } catch (error) {
          console.error("Error playing notification sound:", error);
        }
        setConsignations((prev) => prev.filter((item) => item.id !== payload.old.id));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);




/* realtime************************************************************************************************************************************ */

  
  // Mapping status values to French labels
  const statusMapping = {
    pending: "En attente",
    confirmed: "Consigné",
    "deconsigné": "Déconsigné",
  };

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
      .in('status', ['pending', 'confirmed', 'deconsigné'])
      .order("date_consignation", { ascending: false }); // First sort by date
  
    if (error) {
      console.error("Erreur lors de la récupération des consignations :", error);
    } else {
      // 🔥 Custom sorting to make sure 'pending' is always first
      const sortedData = data.sort((a, b) => {
        const statusPriority = { "pending": 1, "confirmed": 2, "deconsigné": 3 };
        return statusPriority[a.status] - statusPriority[b.status];
      });
  
      setConsignations(sortedData);
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













  
  // Define DataTable columns with French labels and formatted date & time
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
      selector: (row) => (row.zones && row.zones.name ? row.zones.name : "non-défini"),
      sortable: true,
    },
    {
      name: "Équipements",
      selector: (row) => row.equipements || "non-défini",
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
      selector: (row) =>
        row.entreprises && row.entreprises.name ? row.entreprises.name : "non-défini",
      sortable: true,
      cell: (row) => (
        <Badge className="px-2 py-1 text-xs bg-gray-600 text-white">
          {row.entreprises?.name}
        </Badge>
      ),
    },
    
    {
      name: "Statut",
      selector: (row) => row.status || "non-défini",
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

  const handleRowClick = (row) => {
    console.log(row.status);
    setSelectedRow(row);
    navigate(`/consignationdetails/${row.id}`);
  };













  
  return (
    <>
      {/* Outer container using flex to center content vertically */}
      <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Card container */}
        <div className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto p-6">
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

          {/* Légende explicative */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-800">Consigné</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white rounded-full mr-2 border-solid border-1 border-gray-600"></div>
              <span className="text-sm text-gray-800">En attente</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-full mr-2 border-solid border-1 border-red-600"></div>
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
            onRowClicked={handleRowClick}
            highlightOnHover
            pointerOnHover
            noDataComponent={
              <div className="p-4 text-center">Aucun enregistrement à afficher</div>
            }
          />
          
        </div>
        
      </div>
      
    </>
  );
};

export default ConsignationList;
