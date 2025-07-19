import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";

import { Keyword, KeywordPayload } from "types";
import { ConfirmationDialog } from "components/ConfirmationDialog";
import KeywordList from "./components/KeywordList";
import KeywordForm from "./components/KeywordForm";
import { useKeywords } from "hooks/useKeywords";
import { AppIcons } from "config/AppIcons";

interface KeywordManagerProps {
  onClose: () => void;
}

type View = "LIST" | "FORM";

export const KeywordManager: React.FC<KeywordManagerProps> = ({ onClose }) => {
  const [view, setView] = useState<View>("LIST");
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [keywordToDeleteId, setKeywordToDeleteId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { keywords, isLoading, addKeyword, updateKeyword, deleteKeyword } =
    useKeywords();

  const handleShowForm = (keyword: Keyword | null = null) => {
    setEditingKeyword(keyword);
    setSearchQuery("");
    setView("FORM");
  };

  const handleShowList = () => {
    setEditingKeyword(null);
    setView("LIST");
  };

  const handleSaveKeyword = async (
    name: string,
    synonyms: string[],
    parent: Keyword | string | null
  ) => {
    let parentId: string | null = null;

    if (typeof parent === "string") {
      const newParentName = parent.trim();
      if (newParentName) {
        const newParent = await addKeyword(newParentName, {
          parent: null,
          synonyms: [],
        });
        if (newParent) {
          parentId = newParent.id;
        }
      }
    } else if (parent) {
      parentId = parent.id;
    }

    const payload: KeywordPayload = {
      name: name,
      data: {
        parent: parentId,
        synonyms: synonyms,
      },
    };

    if (editingKeyword) {
      await updateKeyword(editingKeyword.id, payload);
    } else {
      await addKeyword(payload.name, payload.data);
    }
    handleShowList();
  };

  const handleDeleteRequest = (id: string) => {
    setKeywordToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (keywordToDeleteId) {
      await deleteKeyword(keywordToDeleteId);
    }
    setIsConfirmOpen(false);
    setKeywordToDeleteId(null);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setKeywordToDeleteId(null);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AppIcons.KEYWORDS sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Keyword Manager
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleShowForm()}
            sx={{ mr: 2 }}
          >
            Add New Keyword
          </Button>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <AppIcons.CLOSE />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        {isLoading && <CircularProgress />}
        {!isLoading && view === "LIST" && (
          <KeywordList
            keywords={keywords}
            onEdit={handleShowForm}
            onDelete={handleDeleteRequest}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {!isLoading && view === "FORM" && (
          <KeywordForm
            initialKeyword={editingKeyword}
            keywords={keywords}
            onSave={handleSaveKeyword}
            onCancel={handleShowList}
          />
        )}
      </Box>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Delete Keyword"
        message="Are you sure you want to delete this keyword? This action cannot be undone. If this keyword is a parent, its children will become top-level keywords."
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
        confirmButtonText="Delete"
      />
    </Box>
  );
};
