import React, { useState, useEffect, useMemo, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import EditableField from "./EditableField";
import TagInput from "./TagInput";
import CountryInput from "./CountryInput";
import MapModal from "./MapModal";
import { ImageMetadata } from "./types";

interface MetadataPanelProps {
  selectedImageNames: string[];
  folderPath: string;
  getImageUrl: (imageName: string) => string;
  onRename: (filesToRename: string[]) => void;
}

// --- Custom Hooks ---
const useSelectionMetadata = (
  selectedImageNames: string[],
  folderPath: string
) => {
  const [allMetadata, setAllMetadata] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(() => {
    if (selectedImageNames.length === 0) {
      setAllMetadata([]);
      return;
    }
    setIsLoading(true);
    const promises = selectedImageNames.map((name) => {
      const fullPath = `${folderPath}\\${name}`;
      return fetch(
        `http://localhost:5000/api/metadata?path=${encodeURIComponent(
          fullPath
        )}`
      ).then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch metadata"))
      );
    });

    Promise.all(promises)
      .then((results: ImageMetadata[]) => setAllMetadata(results))
      .catch((err) => console.error("Batch metadata fetch error:", err))
      .finally(() => setIsLoading(false));
  }, [selectedImageNames, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { allMetadata, isLoading, refetch };
};

const useMetadataForm = (allMetadata: ImageMetadata[]) => {
  const [formState, setFormState] = useState<Partial<ImageMetadata>>({});
  const [originalFormState, setOriginalFormState] = useState<
    Partial<ImageMetadata>
  >({});

  useEffect(() => {
    if (allMetadata.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    const newFormState: Partial<ImageMetadata> = {};
    const keysToProcess: (keyof ImageMetadata)[] = [
      "Keywords",
      "Caption",
      "Author",
      "EXIF:DateTimeOriginal",
      "EXIF:OffsetTimeOriginal",
      "DecimalLatitude",
      "DecimalLongitude",
      "XMP:Location",
      "XMP:City",
      "XMP:State",
      "XMP:Country",
      "XMP:CountryCode",
    ];

    keysToProcess.forEach((key) => {
      const firstValue = allMetadata[0]?.[key];
      const allHaveSameValue = allMetadata.every(
        (meta) => JSON.stringify(meta[key]) === JSON.stringify(firstValue)
      );

      if (allHaveSameValue) {
        newFormState[key] = firstValue as any; // Cast to 'any' here is acceptable because the source is 'any'
      } else {
        newFormState[key] = "(Mixed Values)";
      }
    });

    setFormState(newFormState);
    setOriginalFormState(newFormState);
  }, [allMetadata]);

  const hasChanges = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(originalFormState),
    [formState, originalFormState]
  );
  return { formState, setFormState, hasChanges };
};

// --- Main Typed Component ---
const MetadataPanel: React.FC<MetadataPanelProps> = ({
  selectedImageNames,
  folderPath,
  getImageUrl,
  onRename,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const {
    allMetadata,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionMetadata(selectedImageNames, folderPath);
  const { formState, setFormState, hasChanges } = useMetadataForm(allMetadata);

  const handleFormChange = (fieldName: keyof ImageMetadata, newValue: any) => {
    setFormState((prevState) => ({ ...prevState, [fieldName]: newValue }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const filesToSave = selectedImageNames.map(
      (name) => `${folderPath}\\${name}`
    );
    const payload = { files: filesToSave, metadata: formState };

    fetch("http://localhost:5000/api/save_metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        res.ok ? res.json() : res.json().then((err) => Promise.reject(err))
      )
      .then((data) => {
        console.log("Save successful:", data.message);
        refetch();
      })
      .catch((err) =>
        alert(`Error saving metadata: ${err.details || "Unknown error"}`)
      )
      .finally(() => setIsSaving(false));
  };

  const handleLocationSet = (latlng: { lat: number; lng: number }) => {
    setFormState((prev) => ({
      ...prev,
      DecimalLatitude: latlng.lat,
      DecimalLongitude: latlng.lng,
    }));
  };

  const getDateTimeObject = (): Date | null => {
    const dateStr = formState["EXIF:DateTimeOriginal"];
    if (!dateStr || typeof dateStr !== "string" || dateStr === "(Mixed Values)")
      return null;
    try {
      return new Date(dateStr.replace(/:/, "-").replace(/:/, "-"));
    } catch (e) {
      return null;
    }
  };

  if (selectedImageNames.length === 0) {
    return (
      <div className="metadata-panel">
        <p>Select an image to view its metadata.</p>
      </div>
    );
  }

  const previewImageName = selectedImageNames[selectedImageNames.length - 1];
  const previewImageUrl = getImageUrl(previewImageName);

  return (
    <div className="metadata-panel">
      <ImagePreview imageUrl={previewImageUrl} imageName={previewImageName} />
      <div className="metadata-header">
        <h3>Metadata</h3>
        <span>{selectedImageNames.length} item(s) selected</span>
      </div>
      {isMetadataLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="metadata-form">
          <h4>Content</h4>
          <EditableField
            label="Caption / Description"
            value={formState.Caption ?? ""}
            onChange={(val) => handleFormChange("Caption", val)}
          />
          {Array.isArray(formState.Keywords) ? (
            <TagInput
              label="Keywords"
              value={formState.Keywords}
              onChange={(val) => handleFormChange("Keywords", val)}
            />
          ) : (
            <EditableField
              label="Keywords (Mixed Values)"
              value={formState.Keywords ?? "(Mixed Values)"}
              onChange={(val) =>
                handleFormChange(
                  "Keywords",
                  val.split(",").map((k) => k.trim())
                )
              }
            />
          )}
          <hr />
          <h4>When</h4>
          <div className="form-row">
            <div className="editable-field" style={{ flexGrow: 2 }}>
              <label className="editable-field-label">Date Taken</label>
              <DatePicker
                selected={getDateTimeObject()}
                onChange={(date: Date | null) => {
                  if (date) {
                    // Format to "YYYY:MM:DD HH:MM:SS" which ExifTool understands
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1)
                      .toString()
                      .padStart(2, "0");
                    const day = date.getDate().toString().padStart(2, "0");
                    const hours = date.getHours().toString().padStart(2, "0");
                    const minutes = date
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");
                    const seconds = date
                      .getSeconds()
                      .toString()
                      .padStart(2, "0");
                    const formattedDate = `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
                    handleFormChange("EXIF:DateTimeOriginal", formattedDate);
                  } else {
                    // If the date is cleared, set the value to an empty string
                    handleFormChange("EXIF:DateTimeOriginal", "");
                  }
                }}
                showTimeSelect
                timeIntervals={1}
                timeCaption="Time"
                dateFormat="yyyy-MM-dd HH:mm:ss"
                className="editable-field-input"
                wrapperClassName="date-picker-wrapper"
              />
            </div>
            <EditableField
              label="Time Zone"
              value={formState["EXIF:OffsetTimeOriginal"] ?? ""}
              onChange={(val) =>
                handleFormChange("EXIF:OffsetTimeOriginal", val)
              }
            />
          </div>
          <hr />
          <h4>Where</h4>
          <div className="form-row">
            <EditableField
              label="GPS Latitude"
              value={String(formState.DecimalLatitude ?? "")}
              onChange={(val) => handleFormChange("DecimalLatitude", val)}
            />
            <EditableField
              label="GPS Longitude"
              value={String(formState.DecimalLongitude ?? "")}
              onChange={(val) => handleFormChange("DecimalLongitude", val)}
            />
          </div>
          <button
            type="button"
            className="button-secondary"
            style={{ width: "100%", marginBottom: "15px" }}
            onClick={() => setIsMapOpen(true)}
          >
            Select on Map
          </button>
          <EditableField
            label="Sublocation"
            value={formState["XMP:Location"] ?? ""}
            onChange={(val) => handleFormChange("XMP:Location", val)}
          />
          <EditableField
            label="City"
            value={formState["XMP:City"] ?? ""}
            onChange={(val) => handleFormChange("XMP:City", val)}
          />
          <EditableField
            label="State/Province"
            value={formState["XMP:State"] ?? ""}
            onChange={(val) => handleFormChange("XMP:State", val)}
          />
          <div className="form-row">
            <CountryInput
              label="Country"
              countryValue={formState["XMP:Country"] ?? ""}
              onCountryChange={(val) => handleFormChange("XMP:Country", val)}
              onCodeChange={(val) => handleFormChange("XMP:CountryCode", val)}
            />
            <EditableField
              label="Code"
              value={formState["XMP:CountryCode"] ?? ""}
              onChange={(val) => handleFormChange("XMP:CountryCode", val)}
            />
          </div>
          <hr />
          <h4>Who</h4>
          <EditableField
            label="Author / By-line"
            value={formState.Author ?? ""}
            onChange={(val) => handleFormChange("Author", val)}
          />
          <button
            className="button-success"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={handleLocationSet}
        initialCoords={
          typeof formState.DecimalLatitude === "number" &&
          typeof formState.DecimalLongitude === "number"
            ? {
                lat: formState.DecimalLatitude,
                lng: formState.DecimalLongitude,
              }
            : null
        }
      />
    </div>
  );
};

const ImagePreview: React.FC<{
  imageUrl: string | null;
  imageName: string | null;
}> = ({ imageUrl, imageName }) => {
  if (!imageUrl)
    return <div className="image-preview-placeholder">No image selected</div>;
  return (
    <div className="image-preview-container">
      <img src={imageUrl} alt={imageName || ""} className="preview-image" />
    </div>
  );
};

export default MetadataPanel;
