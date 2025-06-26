import React from "react";

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => {
  const isMixed = value === "(Mixed Values)";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isMixed) {
      e.target.select();
    }
  };

  return (
    <div className="editable-field">
      <label className="editable-field-label">{label}</label>
      <input
        type={type}
        value={isMixed ? "" : value}
        onChange={handleChange}
        onFocus={handleFocus}
        className="editable-field-input"
        placeholder={isMixed ? "(Mixed Values)" : placeholder}
      />
    </div>
  );
};

export default EditableField;
