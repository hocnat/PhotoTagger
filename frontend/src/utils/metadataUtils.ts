import { MetadataValue } from "../types";

/**
 * A shared utility function to safely extract the value and consolidation status
 * from a metadata field object. It provides sensible defaults for empty or
 * mixed-value fields.
 * @param field The metadata field from the form state.
 * @param defaultValue The default value to return if the field is empty.
 * @returns An object containing the field's `value` and `isConsolidated` status.
 */
export const getFieldData = <T>(
  field: MetadataValue<T> | "(Mixed Values)" | undefined,
  defaultValue: T
): { value: T; isConsolidated: boolean } => {
  if (field && typeof field === "object" && "value" in field) {
    return { value: field.value, isConsolidated: field.isConsolidated };
  }
  // For empty fields or "(Mixed Values)", return the default value and assume consolidated.
  return { value: defaultValue, isConsolidated: true };
};
