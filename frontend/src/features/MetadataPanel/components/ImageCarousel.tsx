import { Box, IconButton, SxProps } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Slider from "react-slick";
import { Theme } from "@mui/material/styles";

// --- Vertical Arrow Components with conditional rendering ---
function VerticalNextArrow(props: any) {
  const { onClick, currentSlide, slideCount, slidesToShow } = props;
  const isLastSlide = currentSlide >= slideCount - slidesToShow;

  if (isLastSlide) {
    return null;
  }

  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        bottom: 5,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        "&:hover": { backgroundColor: "white" },
      }}
      size="small"
    >
      <KeyboardArrowDownIcon />
    </IconButton>
  );
}

function VerticalPrevArrow(props: any) {
  const { onClick, currentSlide } = props;
  const isFirstSlide = currentSlide === 0;

  if (isFirstSlide) {
    return null;
  }

  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: 5,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        "&:hover": { backgroundColor: "white" },
      }}
      size="small"
    >
      <KeyboardArrowUpIcon />
    </IconButton>
  );
}

interface ImageCarouselProps {
  imageNames: string[];
  getImageUrl: (imageName: string) => string;
  onImageClick: (imageName: string) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  imageNames,
  getImageUrl,
  onImageClick,
}) => {
  const slidesToShowVertical = 5;

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: slidesToShowVertical,
    slidesToScroll: 1,
    arrows: imageNames.length > slidesToShowVertical,
    vertical: true,
    verticalSwiping: true,
    nextArrow: <VerticalNextArrow slidesToShow={slidesToShowVertical} />,
    prevArrow: <VerticalPrevArrow />,
  };

  const containerSx: SxProps<Theme> = {
    position: "relative",
    height: "100%",
    p: 1,
    ".slick-slider, .slick-list, .slick-track": { height: "100%" },
    ".slick-slide": {
      py: "8px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  };

  const slideBoxSx: SxProps<Theme> = {
    position: "relative",
    cursor: "pointer",
    height: "120px",
    width: "100%",
    "&:hover .overlay": { opacity: 1 },
  };

  return (
    <Box className="image-carousel-container" sx={containerSx}>
      <Slider {...settings}>
        {imageNames.map((name) => (
          <Box key={name} onClick={() => onImageClick(name)} sx={slideBoxSx}>
            <img
              src={getImageUrl(name)}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "#f0f0f0",
              }}
            />
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.3s",
              }}
            >
              <ZoomInIcon fontSize="large" />
            </Box>
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default ImageCarousel;
