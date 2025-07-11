import { AggregatedValue } from "types";

export const MIXED_VALUES_PLACEHOLDER = "(Mixed Values)";

/**
 * Gets the display value for a form field.
 * If the field has a unique value, it returns it; otherwise, it returns an empty string.
 * This is used for the `value` prop of an input.
 * @param field The AggregatedValue field from the form state.
 * @returns The value to display or an empty string.
 */
export function getDisplayValue<T>(
  field: AggregatedValue<T> | undefined
): T | "" {
  if (field?.status === "unique") {
    // Return empty string for null or undefined values to prevent React controlled/uncontrolled warnings.
    return field.value ?? "";
  }
  return "";
}

/**
 * Gets the placeholder text for a form field.
 * If the field has mixed values, it returns the placeholder text; otherwise, it returns an empty string.
 * This is used for the `placeholder` prop of an input.
 * @param field The AggregatedValue field from the form state.
 * @returns The placeholder text or an empty string.
 */
export function getPlaceholder(
  field: AggregatedValue<any> | undefined
): string {
  if (field?.status === "mixed") {
    return MIXED_VALUES_PLACEHOLDER;
  }
  return "";
}
