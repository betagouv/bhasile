"use client";

import { ReactElement, useEffect, useState } from "react";

export default function Usage(): ReactElement {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIframeUrl = async () => {
      try {
        const response = await fetch("/api/metabase");
        if (!response.ok) {
          throw new Error("Erreur lors de la génération du token Metabase");
        }
        const data = await response.json();
        setIframeUrl(data.iframeUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      }
    };

    fetchIframeUrl();
  }, []);

  if (error) {
    return (
      <div className="flex-1 w-full flex justify-center items-center py-8">
        <div className="text-red-600">Erreur : {error}</div>
      </div>
    );
  }

  const isLoading = !iframeUrl || !iframeLoaded;

  return (
    <div className="flex-1 w-full flex justify-center items-stretch py-8 relative">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center">
          <div>
            Les statistiques d’usage sont en cours de chargement : merci de
            patienter quelques instants.
          </div>
        </div>
      )}
      {iframeUrl ? (
        <div className="w-4/5">
          <iframe
            src={iframeUrl}
            className="border-0 w-full h-full"
            title="Statistiques Bhasile"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      ) : (
        <div className="w-4/5 min-h-[400px]" />
      )}
    </div>
  );
}
