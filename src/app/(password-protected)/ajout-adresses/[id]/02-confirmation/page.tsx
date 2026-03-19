"use client";

export default function StepConfirmation() {
  return (
    <div className="max-w-md mx-auto mt-auto h-[calc(100vh-12rem)] text-center flex flex-col items-center justify-center animate-fade-in">
      <i
        className="fr-icon-success-line mb-4 text-action-high-blue-france text-4xl [&::before]:[--icon-size:9rem]"
        aria-label="Succès"
        role="img"
      ></i>
      <h1 className="text-title-blue-france text-xl mb-0 flex gap-2 mx-auto">
        Vous avez terminé l’enregistrement des adresses de votre structure.
      </h1>
      <p>
        Merci pour votre mobilisation, nous nous excusons
        <br />
        pour la gêne occasionnée.
      </p>
    </div>
  );
}
