import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import MapIcon from "@mui/icons-material/Map";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import PlaceIcon from "@mui/icons-material/Place";
import PublicIcon from "@mui/icons-material/Public";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import StyleIcon from "@mui/icons-material/Style";
import SyncIcon from "@mui/icons-material/Sync";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

/**
 * A centralized, type-safe, and refactoring-friendly catalog of semantically
 * named icons used throughout the application.
 */
export const AppIcons = {
  // --- General & Toolbar Actions ---
  LOAD: FolderOpenIcon,
  SETTINGS: SettingsIcon,
  SEARCH: SearchIcon,

  // --- Core CRUD Actions ---
  ADD: AddIcon,
  EDIT: EditIcon,
  DELETE: DeleteIcon,
  RESET: RestartAltIcon,
  CLOSE: CloseIcon,

  // --- Directional Navigation ---
  MOVE_LEFT: ChevronLeftIcon,
  MOVE_RIGHT: ChevronRightIcon,
  MOVE_UP: ExpandLessIcon,
  MOVE_DOWN: ExpandMoreIcon,
  CHANGE_FROM_TO: ArrowForwardIcon,

  // --- Feature-Specific Entry Points ---
  HEALTH_CHECK: HealthAndSafetyIcon,
  KEYWORDS: StyleIcon,
  LOCATION: PublicIcon,
  MAP: MapIcon,
  TIME_SHIFT: MoreTimeIcon,
  GEOTAG_GPX: RouteIcon,

  // --- Health Check & Status Indicators ---
  // Individual check types
  CONSOLIDATION: SyncIcon,
  REQUIRED_FIELDS: ChecklistIcon,
  FILENAME: SpellcheckIcon,
  // Binary status (pass/fail)
  STATUS_SUCCESS: CheckIcon,
  STATUS_ERROR: CloseIcon,
  // Summary status (for groups)
  SUMMARY_SUCCESS: CheckCircleOutlineIcon,
  SUMMARY_WARNING: WarningAmberIcon,

  // --- Quantitative Actions ---
  INCREMENT: AddIcon,
  DECREMENT: RemoveIcon,

  // --- Miscellaneous Actions ---
  BOOKMARK: BookmarkAddIcon,
  IMPORT: CloudUploadOutlinedIcon,
  MARKER: PlaceIcon,
  ZOOM_IN: ZoomInIcon,
  ZOOM_OUT: ZoomOutIcon,
} as const;
