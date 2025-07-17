import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageName: string | null;
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90vw",
  height: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  display: "flex",
  flexDirection: "column",
};

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <ButtonGroup
      variant="contained"
      aria-label="outlined primary button group"
      sx={{ position: "absolute", top: 16, right: 70, zIndex: 1 }}
    >
      <Button onClick={() => zoomIn()}>
        <AppIcons.ZOOM_IN />
      </Button>
      <Button onClick={() => zoomOut()}>
        <AppIcons.ZOOM_OUT />
      </Button>
      <Button onClick={() => resetTransform()}>
        <AppIcons.RESET />
      </Button>
    </ButtonGroup>
  );
};

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}) => {
  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="image-preview-modal-title"
    >
      <Box sx={modalStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            flexShrink: 0,
          }}
        >
          <Typography id="image-preview-modal-title" variant="h6">
            {imageName}
          </Typography>
          <IconButton onClick={onClose}>
            <AppIcons.CLOSE />
          </IconButton>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            cursor: "grab",
            background: "#f0f0f0",
            borderRadius: 1,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
          >
            {() => (
              <>
                <Controls />
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%" }}
                >
                  <img
                    src={imageUrl}
                    alt={imageName || "Image preview"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </Box>
      </Box>
    </Modal>
  );
};

export default ImageModal;
