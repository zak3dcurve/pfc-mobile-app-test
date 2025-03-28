import React, { useState, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import SignatureCanvas from "react-signature-canvas";

const AddPermisFeu = () => {
  // Refs for signature canvases
  const sigSurveillanceRef = useRef(null);
  const sigSiteRef = useRef(null);

  // Example options – in a real app these would come from an API or context.
  const personOptions = [
    { value: "person1", label: "Person 1" },
    { value: "person2", label: "Person 2" },
  ];
  const entrepriseOptions = [
    { value: "entreprise1", label: "Entreprise 1" },
    { value: "entreprise2", label: "Entreprise 2" },
  ];
  const lieuOptions = [
    { value: "lieu1", label: "Lieu 1" },
    { value: "lieu2", label: "Lieu 2" },
  ];

  // State for select fields
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedLieu, setSelectedLieu] = useState(null);
  const [selectedSurveillance, setSelectedSurveillance] = useState(null);
  const [selectedTravauxPerson, setSelectedTravauxPerson] = useState(null);
  const [selectedSiteResponsable, setSelectedSiteResponsable] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-4 overflow-auto pt-20">
      <form className="max-w-6xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">Permis de Feu</h1>

        {/* Horaires */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Horaires</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure de début
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure de fin
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Début pause déjeuner
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fin pause déjeuner
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
          </div>
        </section>

        {/* Responsable de la surveillance */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Responsable de la surveillance
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Choix (E.E / E.U)
            </label>
            <div className="mt-1">
              <label className="mr-4 inline-flex items-center">
                <input type="radio" name="surveillance_choice" className="form-radio" />
                <span className="ml-2">E.E</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="surveillance_choice" className="form-radio" />
                <span className="ml-2">E.U</span>
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Nom du responsable
            </label>
            <CreatableSelect
              options={personOptions}
              value={selectedSurveillance}
              onChange={setSelectedSurveillance}
              placeholder="Sélectionnez ou créez un responsable"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Signature du responsable
            </label>
            <div className="mt-1 border border-gray-300 rounded w-full h-32">
              <SignatureCanvas
                penColor="black"
                canvasProps={{ width: 500, height: 150, className: "signatureCanvas" }}
                ref={sigSurveillanceRef}
              />
            </div>
            <button
              type="button"
              onClick={() => sigSurveillanceRef.current.clear()}
              className="mt-2 text-blue-600 text-sm"
            >
              Effacer la signature
            </button>
          </div>
        </section>

        {/* Travaux réalisés par */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Travaux réalisés par</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom du personne
            </label>
            <CreatableSelect
              options={personOptions}
              value={selectedTravauxPerson}
              onChange={setSelectedTravauxPerson}
              placeholder="Sélectionnez ou créez un responsable"
            />
          </div>
        </section>

        {/* Responsable du site / délégation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Responsable du site / délégation
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom du responsable
            </label>
            <CreatableSelect
              options={personOptions}
              value={selectedSiteResponsable}
              onChange={setSelectedSiteResponsable}
              placeholder="Sélectionnez ou créez un responsable"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Signature
            </label>
            <div className="mt-1 border border-gray-300 rounded w-full h-32">
              <SignatureCanvas
                penColor="black"
                canvasProps={{ width: 500, height: 150, className: "signatureCanvas" }}
                ref={sigSiteRef}
              />
            </div>
            <button
              type="button"
              onClick={() => sigSiteRef.current.clear()}
              className="mt-2 text-blue-600 text-sm"
            >
              Effacer la signature
            </button>
          </div>
        </section>

        {/* Lieu et Opération */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Localisation & Opération</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Localisation / Lieu
            </label>
            <CreatableSelect
              options={lieuOptions}
              value={selectedLieu}
              onChange={setSelectedLieu}
              placeholder="Sélectionnez ou créez un lieu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Opération à effectuer
            </label>
            <textarea
              rows="3"
              placeholder="Description de l'opération"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            ></textarea>
          </div>
        </section>

        {/* Photo */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Photo</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Télécharger une photo
            </label>
            <input type="file" className="mt-1 block w-full" />
          </div>
        </section>

        {/* Source de Chaleur */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Source de Chaleur</h2>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Soudure électrique</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Découpage électrique</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Soudure chalumeau</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Découpage chalumeau</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Lampe souder</span>
            </label>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Autre (préciser)
              </label>
              <input
                type="text"
                placeholder="Autre source"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
          </div>
        </section>

        {/* Facteurs Aggravants */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Facteurs Aggravants</h2>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Matières combustibles</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Poussières</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Convoyeurs</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Coactivité</span>
            </label>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Autre (préciser)
              </label>
              <input
                type="text"
                placeholder="Autre facteur"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
          </div>
        </section>

        {/* Mesures de Prévention AVANT LE TRAVAIL */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Mesures de Prévention - AVANT LE TRAVAIL
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Vérifier matériel en parfait état",
                name: "before_check_material",
              },
              {
                label: "Éloigner 10m des matériaux combustibles",
                name: "before_eloigner10m",
              },
              {
                label: "Balayer la zone",
                name: "before_balayer_zone",
              },
              {
                label: "Baliser la zone",
                name: "before_baliser_zone",
              },
              {
                label: "Purger/nettoyer volumes creux",
                name: "before_purger_volumes",
              },
              {
                label: "Aveugler les ouvertures",
                name: "before_aveugler_ouvertures",
              },
              {
                label: "Disposer moyens d'alarme",
                name: "before_disposer_moyens_alarme",
              },
              {
                label: "RIA opérationnel",
                name: "before_ria_operationnel",
              },
              {
                label: "Vérifier zone ATEX",
                name: "before_zone_atex",
              },
              {
                label: "Détection incendie",
                name: "before_detection_incendie",
              },
            ].map((item, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700">
                  {item.label}
                </label>
                <div className="mt-1">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      name={`${item.name}_ee`}
                      className="form-checkbox"
                    />
                    <span className="ml-2">E.E</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name={`${item.name}_eu`}
                      className="form-checkbox"
                    />
                    <span className="ml-2">E.U</span>
                  </label>
                </div>
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Autres mesures (préciser)
              </label>
              <textarea
                rows="2"
                placeholder="Autres mesures de prévention avant le travail"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Mesures de Prévention PENDANT LE TRAVAIL */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Mesures de Prévention - PENDANT LE TRAVAIL
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Surveiller les projections
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    name="during_surveiller_projections_ee"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.E</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="during_surveiller_projections_eu"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.U</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ne pas déposer d'objets chauds
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    name="during_no_deposer_objets_chauds_ee"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.E</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="during_no_deposer_objets_chauds_eu"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.U</span>
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Surveillance continue
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    name="during_surveillance_continu_ee"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.E</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="during_surveillance_continu_eu"
                    className="form-checkbox"
                  />
                  <span className="ml-2">E.U</span>
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Autres mesures (préciser)
              </label>
              <textarea
                rows="2"
                placeholder="Autres mesures de prévention pendant le travail"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-8 py-3 bg-indigo-600 text-white rounded-md font-semibold"
          >
            Valider le Permis de Feu
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPermisFeu;
