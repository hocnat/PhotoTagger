import { useState, useCallback, useEffect } from "react";
import { Keyword, KeywordData } from "types";
import * as api from "api/apiService";
import { useNotification } from "./useNotification";

export const useKeywords = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getKeywords();
      setKeywords(data);
    } catch (error) {
      showNotification("Error fetching keywords", "error");
      console.error("Failed to fetch keywords:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const addKeyword = async (
    name: string,
    data: KeywordData
  ): Promise<Keyword | undefined> => {
    try {
      const newKeyword = await api.addKeyword(name, data);
      showNotification("Keyword added successfully", "success");
      await fetchKeywords();
      return newKeyword;
    } catch (error) {
      showNotification("Error adding keyword", "error");
      console.error("Failed to add keyword:", error);
      return undefined;
    }
  };

  const updateKeyword = async (
    id: string,
    updates: { name?: string; data?: KeywordData }
  ) => {
    try {
      await api.updateKeyword(id, updates);
      showNotification("Keyword updated successfully", "success");
      await fetchKeywords();
    } catch (error) {
      showNotification("Error updating keyword", "error");
      console.error("Failed to update keyword:", error);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      await api.deleteKeyword(id);
      showNotification("Keyword deleted successfully", "success");
      await fetchKeywords();
    } catch (error) {
      showNotification("Error deleting keyword", "error");
      console.error("Failed to delete keyword:", error);
    }
  };

  return {
    keywords,
    isLoading,
    fetchKeywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
  };
};
