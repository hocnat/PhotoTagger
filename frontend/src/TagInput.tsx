import React, { useState, useEffect } from "react";

interface TagInputProps {
  label: string;
  value: string[] | string;
  onChange: (newValue: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ label, value, onChange }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const tags = Array.isArray(value) ? value : [];

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if (inputValue.trim()) {
      fetch(
        `http://localhost:5000/api/suggestions?q=${encodeURIComponent(
          inputValue
        )}`,
        { signal }
      )
        .then((res) => res.json())
        .then((data: string[]) => setSuggestions(data))
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Suggestion fetch error:", err);
          }
        });
    } else {
      setSuggestions([]);
    }

    return () => {
      controller.abort();
    };
  }, [inputValue]);

  const addTags = (tagsToAdd: string[]) => {
    const newTags = tagsToAdd
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && !tags.includes(tag));

    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(inputValue.split(","));
      setInputValue("");
      setSuggestions([]);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    addTags([suggestion]);
    setInputValue("");
    setSuggestions([]);
  };

  return (
    <div className="editable-field">
      <label className="editable-field-label">{label}</label>
      <div className="tag-input-container">
        {tags.map((tag) => (
          <div key={tag} className="tag-item">
            <span className="tag-text">{tag}</span>
            <button
              type="button"
              className="tag-remove-button"
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="tag-input"
          placeholder="Add keywords..."
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion) => (
            <li key={suggestion} onClick={() => addSuggestion(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
