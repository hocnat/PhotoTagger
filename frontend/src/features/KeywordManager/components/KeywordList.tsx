import { useMemo } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import { Keyword } from "types";
import SearchInput from "components/SearchInput";
import { AppIcons } from "config/AppIcons";

interface KeywordListProps {
  keywords: Keyword[];
  onEdit: (keyword: Keyword) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface HierarchicalKeyword extends Keyword {
  children: HierarchicalKeyword[];
  level: number;
}

const KeywordListItem: React.FC<{
  item: HierarchicalKeyword;
  allKeywords: Keyword[];
  onEdit: (keyword: Keyword) => void;
  onDelete: (id: string) => void;
}> = ({ item, allKeywords, onEdit, onDelete }) => {
  const parent = item.data.parent
    ? allKeywords.find((k) => k.id === item.data.parent)
    : null;

  return (
    <>
      <ListItem
        sx={{
          pl: item.level * 4,
          borderLeft: item.level > 0 ? "2px solid #eee" : "none",
          ml: item.level > 0 ? 2 : 0,
        }}
        secondaryAction={
          <Box>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => onEdit(item)}
            >
              <AppIcons.EDIT />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => onDelete(item.id)}
            >
              <AppIcons.DELETE />
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Typography variant="body1" component="span">
              {item.name}
            </Typography>
          }
          secondary={
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              {parent && (
                <Tooltip title="Parent">
                  <Chip
                    label={`Parent: ${parent.name}`}
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                </Tooltip>
              )}
              {item.data.synonyms.map((syn) => (
                <Tooltip key={syn} title="Synonym">
                  <Chip label={syn} sx={{ mr: 1, mb: 0.5 }} />
                </Tooltip>
              ))}
            </Box>
          }
        />
      </ListItem>
      {item.children.map((child) => (
        <KeywordListItem
          key={child.id}
          item={child}
          allKeywords={allKeywords}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

const KeywordList: React.FC<KeywordListProps> = ({
  keywords,
  onEdit,
  onDelete,
  searchQuery,
  setSearchQuery,
}) => {
  const hierarchicalKeywords = useMemo(() => {
    const keywordMap = new Map<string, Keyword>();
    keywords.forEach((kw) => keywordMap.set(kw.id, kw));

    let visibleKeywords = keywords;

    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const matchingIds = new Set<string>();

      // Find keywords that match directly
      for (const kw of keywords) {
        const nameMatch = kw.name.toLowerCase().includes(normalizedQuery);
        const synonymMatch = kw.data.synonyms.some((s) =>
          s.toLowerCase().includes(normalizedQuery)
        );
        if (nameMatch || synonymMatch) {
          matchingIds.add(kw.id);
        }
      }

      // For each match, ensure its parents are also visible
      matchingIds.forEach((id) => {
        let current = keywordMap.get(id);
        while (current?.data.parent) {
          matchingIds.add(current.data.parent);
          current = keywordMap.get(current.data.parent);
        }
      });

      visibleKeywords = keywords.filter((kw) => matchingIds.has(kw.id));
    }

    const hierarchicalMap = new Map<string, HierarchicalKeyword>();
    const rootKeywords: HierarchicalKeyword[] = [];

    visibleKeywords.forEach((kw) => {
      hierarchicalMap.set(kw.id, { ...kw, children: [], level: 0 });
    });

    hierarchicalMap.forEach((kw) => {
      if (kw.data.parent && hierarchicalMap.has(kw.data.parent)) {
        const parent = hierarchicalMap.get(kw.data.parent)!;
        parent.children.push(kw);
      } else {
        rootKeywords.push(kw);
      }
    });

    const setLevels = (nodes: HierarchicalKeyword[], level: number) => {
      nodes.forEach((node) => {
        node.level = level;
        setLevels(node.children, level + 1);
      });
    };
    setLevels(rootKeywords, 0);

    return rootKeywords;
  }, [keywords, searchQuery]);

  if (keywords.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" align="center">
        No keywords defined yet. Click "Add New Keyword" to start.
      </Typography>
    );
  }

  return (
    <>
      <SearchInput
        fullWidth
        placeholder="Search keywords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      {hierarchicalKeywords.length > 0 ? (
        <List>
          {hierarchicalKeywords.map((item) => (
            <KeywordListItem
              key={item.id}
              item={item}
              allKeywords={keywords}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          No keywords match your search.
        </Typography>
      )}
    </>
  );
};

export default KeywordList;
