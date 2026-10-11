import * as React from "react";
import { cn } from "@/lib/utils";

type ImageSliderProps = {
  images: string[];
  className?: string;
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  hideArrows?: boolean;
};

const IMAGE_TRANSITION_TIME = 8000;

export function ImageSlider({
  images,
  className,
  autoplay = true,
  interval = IMAGE_TRANSITION_TIME,
  pauseOnHover = true,
  hideArrows = false,
}: ImageSliderProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const goToIndex = (index: number) => {
    const len = images.length;
    const safeIndex = ((index % len) + len) % len;
    setActiveIndex(safeIndex);
  };

  React.useEffect(() => {
    if (!autoplay || isHovered || images.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % images.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoplay, images.length, interval, isHovered]);

  return (
    <div
      className={cn(
        "relative w-full h-screen overflow-hidden select-none",
        className
      )}
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {images.length > 0 && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-black/60"
          )}
        >
          <img
            src={images[activeIndex]}
            alt={`HAIDRONICS slide ${activeIndex + 1}`}
            className={cn(
              "max-w-none max-h-full object-cover transition-opacity duration-2000 ease-in-out",
              activeIndex === 0 && "opacity-100",
              activeIndex > 0 && "opacity-0",
              "group-hover:opacity-100"
            )}
            onError={event => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/haidronics-brand.png";
            }}
          />
        </div>
      )}

      {/* Navigation dots */}
      {images.length > 1 && (
        <div
          className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2",
            "z-20"
          )}
        >
          {Array.from({ length: images.length }, (_, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-full transition-colors duration-300",
                `bg-white/20 ${activeIndex === i ? 'bg-white' : 'hover:bg-white/30'}`,
              )}
              onClick={() => goToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              disabled={activeIndex === i}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  `bg-white/${activeIndex === i ? '100' : '50'} ${
                    activeIndex === i ? 'w-2' : 'w-1'
                  } ${
                    activeIndex === i ? 'h-2' : 'h-1'
                  } ${
                    activeIndex === i ? 'transition-none' : 'transform'
                  }`)}
                aria-hidden={true}
              />
              <span className="sr-only">Slide {i + 1}</span>
            </button>
          ))}
        </div>
      )}

      {/* Arrows */}
      {!hideArrows && images.length > 1 && (
        <div
          className={cn(
            "absolute top-1/2 left-4 -translate-y-1/2 z-30 flex items-center gap-2",
            "pt-6"
          )}
        >
          <button
            type="button"
            className={cn(
              "w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 transition-colors",
              "flex items-center justify-center",
              "data-previous-slide"
            )}
            onClick={() => goToIndex(activeIndex - 1)}
            aria-label="Previous slide"
          >
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 11l4.58-4.59L15.41 7.41z"
              />
            </svg>
          </button>
          <button
            type="button"
            className={cn(
              "w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center",
              "data-next-slide"
            )}
            onClick={() => goToIndex(activeIndex + 1)}
            aria-label="Next slide"
          >
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M10 6L8.59 7.41 14.17 13H10v4h4l-4.59 4.58L15.41 17.09l-6.41-6.49L10 13l6-6z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Progress bar at top */}
      {autoplay && images.length > 1 && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 bg-black/20",
            "transition-[height] duration-2000 ease-out"
          )}
        >
          <div
            className={cn(
              "h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-700 ease-out"
            )}
            style={{ width: `${((activeIndex + 1) / images.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

ImageSlider.defaultProps = {
  autoplay: true,
  interval: IMAGE_TRANSITION_TIME,
};

export default ImageSlider;
