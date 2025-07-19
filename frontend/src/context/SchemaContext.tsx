import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { MetadataSchema } from "types";
import * as apiService from "api/apiService";

export interface SchemaContextType {
  schema: MetadataSchema | null;
  isLoading: boolean;
}

export const SchemaContext = createContext<SchemaContextType | undefined>(
  undefined
);

export const useSchemaContext = (): SchemaContextType => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error("useSchemaContext must be used within a SchemaProvider");
  }
  return context;
};

export const SchemaProvider = ({ children }: { children: ReactNode }) => {
  const [schema, setSchema] = useState<MetadataSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const fetchedSchema = await apiService.getMetadataSchema();
        setSchema(fetchedSchema);
      } catch (error) {
        console.error("Failed to load metadata schema:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchema();
  }, []);

  const value = { schema, isLoading };

  return (
    <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
  );
};
