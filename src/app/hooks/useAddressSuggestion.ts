export function useAddressSuggestion() {
  return async (query: string): Promise<AddressSuggestion[]> => {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const response = await fetch(
        `https://data.geopf.fr/geocodage/search/?q=${encodeURIComponent(
          query
        )}&limit=5`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data?.features) {
        return data.features.map(
          (feature: AddressFeature): AddressSuggestion => {
            const { properties, geometry } = feature;
            const [x, y] = geometry.coordinates;

            return {
              ...properties,
              x,
              y,
              key:
                properties.id || `${properties.label}-${properties.postcode}`,
              label: properties.label,
            };
          }
        );
      }
      return [];
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      return [];
    }
  };
}

type AddressSuggestion = {
  label: string;
  key: string;
  score: number;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  context?: string;
  type?: string;
  x?: number;
  y?: number;
  importance?: number;
  name?: string;
};

type AddressFeature = {
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    context?: string;
    type?: string;
    importance?: number;
    name?: string;
    id?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
};
