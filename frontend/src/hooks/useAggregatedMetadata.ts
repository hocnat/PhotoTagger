import { useState, useEffect, useMemo } from "react";
import { FormState, ImageFile, Keyword } from "../types";

export const useMetadataForm = (imageFiles: ImageFile[]) => {
  const [formState, setFormState] = useState<Partial<FormState>>({});
  const [originalFormState, setOriginalFormState] = useState<
    Partial<FormState>
  >({});

  useEffect(() => {
    if (imageFiles.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    const newFormState: Partial<FormState> = {};
    const simpleKeys: (keyof Omit<FormState, "Keywords">)[] = [
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

    simpleKeys.forEach((key) => {
      const firstValue = imageFiles[0]?.metadata[key];
      const allSame = imageFiles.every(
        (file) =>
          JSON.stringify(file.metadata[key]) === JSON.stringify(firstValue)
      );
      (newFormState as any)[key] = allSame ? firstValue : "(Mixed Values)";
    });

    const allKeywords = new Set<string>();
    imageFiles.forEach((file) => {
      (file.metadata.Keywords || []).forEach((kw) =>
        allKeywords.add(String(kw))
      );
    });

    const commonKeywords = new Set<string>(
      imageFiles[0]?.metadata.Keywords || []
    );
    for (let i = 1; i < imageFiles.length; i++) {
      const currentKeywords = new Set<string>(
        imageFiles[i].metadata.Keywords || []
      );
      commonKeywords.forEach((commonKw) => {
        if (!currentKeywords.has(commonKw)) {
          commonKeywords.delete(commonKw);
        }
      });
    }

    newFormState.Keywords = Array.from(allKeywords).map(
      (name): Keyword => ({
        name,
        status: commonKeywords.has(name) ? "common" : "partial",
      })
    );

    setFormState(newFormState);
    setOriginalFormState(newFormState);
  }, [imageFiles]);

  const hasChanges = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(originalFormState),
    [formState, originalFormState]
  );

  return { formState, setFormState, hasChanges, originalFormState };
};
