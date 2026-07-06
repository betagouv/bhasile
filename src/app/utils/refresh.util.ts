export const refreshBestEffort = async <TData>(
  url: string,
  apply: (data: TData) => void
): Promise<void> => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      apply(await response.json());
    }
  } catch {}
};
