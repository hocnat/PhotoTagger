import { useState, useMemo } from "react";
import { ImageFile, HealthReport } from "types";

export interface FilterState {
  status:
    | "all"
    | "not-consolidated"
    | "missing-required"
    | "incorrect-filename";
  missingField: string;
  searchTerm: string;
}

/**
 * A hook that takes a full list of images and their health reports, and returns a filtered
 * list based on the user's active filter criteria.
 * @param allImages The complete, unfiltered list of ImageFile objects.
 * @param healthReports A map of filename to its health report.
 */
export const useImageFiltering = (
  allImages: ImageFile[],
  healthReports: Record<string, HealthReport["checks"]>
) => {
  const [filterState, setFilterState] = useState<FilterState>({
    status: "all",
    missingField: "",
    searchTerm: "",
  });

  const filteredImages = useMemo(() => {
    let images = [...allImages];

    // Apply status filter based on health reports
    if (filterState.status !== "all") {
      images = images.filter((image) => {
        const report = healthReports[image.filename];
        if (!report) return false;

        switch (filterState.status) {
          case "not-consolidated":
            return report.consolidation?.status === "error";
          case "missing-required":
            return report.requiredFields?.status === "error";
          case "incorrect-filename":
            return report.filename?.status === "error";
          default:
            return true;
        }
      });
    }

    // Apply missing field filter
    if (filterState.missingField) {
      images = images.filter((image) => {
        if (!image.metadata) return true;
        const value = (image.metadata as any)[filterState.missingField]?.value;
        return (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        );
      });
    }

    // Apply search term filter
    if (filterState.searchTerm) {
      const lowercasedTerm = filterState.searchTerm.toLowerCase();
      images = images.filter((image) => {
        // Search in filename
        if (image.filename.toLowerCase().includes(lowercasedTerm)) {
          return true;
        }
        // Search in all metadata fields' values
        if (image.metadata) {
          return Object.values(image.metadata).some(
            (metadataValue) =>
              metadataValue &&
              String(metadataValue.value).toLowerCase().includes(lowercasedTerm)
          );
        }
        return false;
      });
    }

    return images;
  }, [allImages, healthReports, filterState]);

  return {
    filterState,
    setFilterState,
    filteredImages,
  };
};
