import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Navbar from "@/components/app-navbar";
import { supabase } from "@/features/auth/utils/supabase-client";
import { LoadingSpinner } from "@/components/loadingspinner";
import { Badge } from "@/components/ui/badge";
import notificationSound from "@/assets/notification.mp3";

const ConsignationHome = () => {
  const [consignations, setConsignations] = useState([]);
  const [permis, setPermis] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notificationAudio = useRef(new Audio(notificationSound));
  const allowedStatuses = ["pending", "confirmed", "deconsigné"];

  // Fetch single consignation (for realtime)
  const fetchSingleConsignation = async (id) => {
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
      .eq("id", id)
      .in("status", allowedStatuses)
      .maybeSingle();
    if (error) console.error("Erreur fetchSingleConsignation:", error);
    return data;
  };

  // Realtime subscription
  useEffect(() => {
    const unlockAudio = () => {
      notificationAudio.current
        .play()
        .then(() => {
          notificationAudio.current.pause();
          notificationAudio.current.currentTime = 0;
        })
        .catch(() => {});
    };
    document.addEventListener("click", unlockAudio, { once: true });

    const channel = supabase
      .channel("consignations-ch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consignations" },
        async (payload) => {
          notificationAudio.current.play().catch(() => {});
          const newC = await fetchSingleConsignation(payload.new.id);
          if (newC) setConsignations((prev) => [newC, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "consignations" },
        async (payload) => {
          notificationAudio.current.play().catch(() => {});
          const upd = await fetchSingleConsignation(payload.new.id);
          setConsignations((prev) =>
            upd
              ? prev.map((r) => (r.id === upd.id ? upd : r))
              : prev.filter((r) => r.id !== payload.new.id)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "consignations" },
        (payload) => {
          notificationAudio.current.play().catch(() => {});
          setConsignations((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("click", unlockAudio);
    };
  }, []);

  // Fetch both tables on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Consignations
      const { data: cData, error: cErr } = await supabase
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
        .in("status", allowedStatuses)
        .order("date_consignation", { ascending: false });
      if (cErr) console.error("Erreur fetch consignations:", cErr);
      else setConsignations(groupConsignations(cData));

      // Permis de Feu
      const { data: pData, error: pErr } = await supabase
        .from("permis_de_feu")
        .select(`
          *,
          responsables:persons!resp_surveillance_id(name),
          zones:zones!lieu_id(name)
        `)
        .order("created_at", { ascending: false });
      if (pErr) console.error("Erreur fetch permis:", pErr);
      else setPermis(pData);

      setLoading(false);
    };
    fetchData();
  }, []);

  // Group multi-consignations
  const groupConsignations = (data) => {
    const grouped = [];
    const multi = {};
    data.forEach((r) => {
      if (r.multi_consignation_id && ["pending", "confirmed"].includes(r.status)) {
        if (!multi[r.multi_consignation_id]) multi[r.multi_consignation_id] = { ...r, count: 1 };
        else multi[r.multi_consignation_id].count++;
      } else grouped.push(r);
    });
    Object.values(multi).forEach((g) => grouped.push(g));
    return grouped;
  };

  const statusMapping = {
    pending: "En attente",
    confirmed: "Consigné",
    deconsigné: "Déconsigné",
  };

  // Columns for Consignations
  const columns = [
    {
      name: "   ",
      selector: (r) =>
        r.multi_consignation_id && ["pending", "confirmed"].includes(r.status) ? (
          <span title="Consignation multiple" style={{ fontSize: "1.2rem", color: "#4caf50" }}>
          </span>
        ) : null,
      width: "70px",
    },
    {
      name: "Date et heure",
      selector: (r) =>
        r.date_consignation
          ? `${new Date(r.date_consignation).toLocaleDateString("fr-FR")} ${new Date(
              r.date_consignation
            ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false })}`
          : "N/A",
      sortable: true,
    },
    {
      name: "Zone",
      selector: (r) => r.zones?.name || "non-défini",
      sortable: true,
    },
    {
      name: "Consignateur",
      selector: (r) => r.consignateur?.name || "non-défini",
      sortable: true,
    },
    {
      name: "Intervenant",
      selector: (r) => r.demandeur?.name || "non-défini",
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
      selector: (r) => r.status || "non-défini",
      cell: (r) => (
        <Badge
          className={`px-2 py-1 text-xs ${
            r.status === "pending"
              ? "bg-orange-600/80 text-white"
              : r.status === "confirmed"
              ? "bg-green-600/80 text-white"
              : r.status === "deconsigné"
              ? "bg-red-600/80 text-white"
              : "bg-gray-800/80 text-white"
          }`}
        >
          {statusMapping[r.status] || r.status}
        </Badge>
      ),
      sortable: true,
    },
  ];

  // Columns for Permis de Feu
  const permisColumns = [
    {
      name: "Heure de début",
      selector: (r) =>
        r.heure_debut
          ? new Date(r.heure_debut).toLocaleString("fr-FR", {
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
      selector: (r) =>
        r.heure_fin
          ? new Date(r.heure_fin).toLocaleString("fr-FR", {
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
      selector: (r) => r.zones?.name || "N/A",
      sortable: true,
    },
    {
      name: "Nom responsable",
      selector: (r) => r.responsables?.name || "N/A",
      sortable: true,
    },
    {
      name: "Statut",
      selector: () => "en cours",
      cell: () => <Badge className="px-2 py-1 text-xs bg-green-600 text-white">en cours</Badge>,
      sortable: false,
    },
    {
      name: "Type",
      selector: () => "permis de feu",
      cell: () => <Badge className="px-2 py-1 text-xs bg-blue-600 text-white">permis de feu</Badge>,
      sortable: false,
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: "#1b2631" } },
    headCells: { style: { color: "#fff", fontSize: "14px" } },
    rows: { style: { cursor: "pointer", transition: "background-color 0.3s" } },
  };

  const conditionalRowStyles = [
    {
      when: (r) => r.status === "confirmed",
      style: {
        backgroundColor: "rgba(37, 201, 45, 0.27)",
        "&:hover": { backgroundColor: "rgba(0, 255, 13, 0.27)", color: "#000" },
        "&:active": { backgroundColor: "rgba(2, 100, 17, 0.27)", color: "#000" },
      },
    },
    {
      when: (r) => r.status === "deconsigné",
      style: {
        backgroundColor: "rgba(201, 37, 37, 0.27)",
        "&:hover": { backgroundColor: "rgba(255, 0, 0, 0.27)", color: "#000" },
        "&:active": { backgroundColor: "rgba(100, 2, 2, 0.27)", color: "#000" },
      },
    },
    {
      when: (r) => r.status === "pending",
      style: {
        backgroundColor: "rgba(255, 174, 0, 0.27)",
        "&:hover": { backgroundColor: "rgba(255, 187, 0, 0.27)", color: "#000" },
        "&:active": { backgroundColor: "rgba(255, 123, 0, 0.27)", color: "#000" },
      },
    },
    {
      when: (r) => r.multi_consignation_id && r.status === "pending",
      style: {
        backgroundColor: "#f7faff",
        borderLeft: "4px solid #001f54",
        color: "#001f54",
        fontWeight: "600",
        fontFamily: "Segoe UI, Roboto, sans-serif",
        "&:hover": { backgroundColor: "rgba(255, 187, 0, 0.27)", color: "#000" },
        "&:active": { backgroundColor: "rgba(255, 123, 0, 0.27)", color: "#000" },
      },
    },
    {
      when: (r) => r.multi_consignation_id && r.status === "confirmed",
      style: {
        backgroundColor: "#f7faff",
        borderLeft: "4px solid #001f54",
        color: "#001f54",
        fontWeight: "600",
        fontFamily: "Segoe UI, Roboto, sans-serif",
        "&:hover": { backgroundColor: "rgba(30, 255, 0, 0.27)", color: "#000" },
        "&:active": { backgroundColor: "rgba(0, 255, 42, 0.27)", color: "#000" },
      },
    },
  ];

  const handleRowClickConsignations = (row) => {
    console.log(row.status);
    // If this is a grouped (multiple) record then navigate to the multi details page.
    if (row.multi_consignation_id && ( row.status === "pending" || row.status === "confirmed" ) ) {
      navigate(`/multiconsdetails/${row.multi_consignation_id}`);
    } else {
      navigate(`/consignationdetails/${row.id}`);
    }
  };  
  const handleRowClickPermis = (r) => navigate(`/permisdefeudetails/${r.id}`);

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
    <>
      <Navbar />

      <div className="bg-gray-200 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto mt-20 mb-10">
          {/* Consignations */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
                Consignations
              </h1>
              <div>
                <Link to="/consignationarchives">
                  <button className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-500 active:bg-gray-800 transition-colors">
                    Archives
                  </button>
                </Link>
                <Link to="/consignation">
                  <button className="ml-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors">
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
              fixedHeaderScrollHeight="400px"
              conditionalRowStyles={conditionalRowStyles}
              onRowClicked={handleRowClickConsignations}
              highlightOnHover
              pointerOnHover
              noDataComponent={<div className="p-4 text-center">Aucun enregistrement à afficher</div>}
            />
          </div>

          {/* Permis de Feu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Permis de Feu</h1>
              <Link to="/permisdefeu">
                <button className="ml-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500 active:bg-green-800 transition-colors">
                  Ajouter un permis de feu
                </button>
              </Link>
            </div>
            <DataTable
              columns={permisColumns}
              data={permis}
              customStyles={customStyles}
              fixedHeader
              fixedHeaderScrollHeight="400px"
              conditionalRowStyles={conditionalRowStyles}
              onRowClicked={handleRowClickPermis}
              highlightOnHover
              pointerOnHover
              noDataComponent={<div className="p-4 text-center">Aucun enregistrement à afficher</div>}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsignationHome;
