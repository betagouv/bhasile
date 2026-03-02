"use client";

export default function StepConfirmation() {
  return (
    <div className="max-w-xl mx-auto mt-auto h-[calc(100vh-12rem)] text-center flex flex-col items-center justify-center animate-fade-in">
      <i className="fr-icon-success-line mb-4 text-action-high-blue-france text-4xl [&::before]:[--icon-size:9rem]"></i>
      <h1 className="text-title-blue-france text-xl mb-0 flex gap-2 w-1/2 mx-auto">
        Vous avez terminé la création de cette structure !
      </h1>
      <p>
        Les données ont bien été enregistrées.
        <br />
        Merci pour votre participation, ces informations nous sont très
        précieuses.
      </p>
    </div>
  );
}
