import { Box, IconButton } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Slider from "react-slick";

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        right: -10,
        transform: "translateY(-50%)",
        zIndex: 2,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        "&:hover": {
          backgroundColor: "white",
        },
      }}
      size="small"
    >
      <ChevronRightIcon />
    </IconButton>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        left: -10,
        transform: "translateY(-50%)",
        zIndex: 2,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        "&:hover": {
          backgroundColor: "white",
        },
      }}
      size="small"
    >
      <ChevronLeftIcon />
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
  const settings = {
    dots: imageNames.length > 3,
    infinite: imageNames.length > 3,
    speed: 500,
    slidesToShow: Math.min(imageNames.length, 3),
    slidesToScroll: 1,
    arrows: imageNames.length > 3,
    adaptiveHeight: false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <Box
      className="image-carousel-container"
      sx={{
        position: "relative",
        ".slick-slide": {
          px: "4px",
        },
        ".slick-list": {},
        ".slick-dots li button:before": {
          color: "primary.main",
          opacity: 0.5,
        },
        ".slick-dots li.slick-active button:before": {
          opacity: 1,
        },
      }}
    >
      <Slider {...settings}>
        {imageNames.map((name) => (
          <Box
            key={name}
            onClick={() => onImageClick(name)}
            sx={{
              position: "relative",
              cursor: "pointer",
              height: "180px",
              "&:hover .overlay": {
                opacity: 1,
              },
            }}
          >
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
