import React, { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/themes/provider";

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (position: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size multiple times to ensure proper rendering
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [map]);

  return null;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 40.4093, // Baku, Azerbaijan
  initialLng = 49.8671,
  title = "Select Location",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [position, setPosition] = useState<[number, number]>([
    initialLat,
    initialLng,
  ]);
  const [address, setAddress] = useState<string>("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure map only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset client state when modal opens to force re-render
  useEffect(() => {
    if (isOpen) {
      setIsClient(false);
      const timer = setTimeout(() => {
        setIsClient(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Fetch address from coordinates using Nominatim (OpenStreetMap)
  useEffect(() => {
    if (position) {
      setIsLoadingAddress(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&zoom=18&addressdetails=1`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch((err) => console.error("Error fetching address:", err))
        .finally(() => setIsLoadingAddress(false));
    }
  }, [position]);

  const handleConfirm = () => {
    onSelectLocation(position[0], position[1], address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-lg border shadow-lg",
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white",
          "h-full w-full md:mx-4 md:h-auto md:max-h-[90vh] md:max-w-3xl",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between border-b p-4",
            isDark ? "border-gray-700" : "border-gray-200",
          )}
        >
          <div className="flex items-center gap-2">
            <MapPin
              className={cn(
                "h-5 w-5",
                isDark ? "text-gray-400" : "text-gray-600",
              )}
            />
            <h2
              className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900",
              )}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-md p-2 transition-colors",
              isDark
                ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-800",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map Container */}
        <div
          className="relative flex-1"
          style={{ minHeight: "400px", height: "500px" }}
        >
          {!isClient ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-500",
                )}
              >
                Loading map...
              </div>
            </div>
          ) : (
            <MapContainer
              center={position}
              zoom={13}
              style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                inset: 0,
              }}
              zoomControl={true}
              scrollWheelZoom={true}
              key={`map-${isOpen}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapResizer />
            </MapContainer>
          )}
        </div>

        {/* Address Info */}
        <div
          className={cn(
            "border-t p-4",
            isDark ? "border-gray-700" : "border-gray-200",
          )}
        >
          <div className="mb-4">
            <p
              className={cn(
                "mb-1 text-sm font-medium",
                isDark ? "text-gray-400" : "text-gray-600",
              )}
            >
              Selected Coordinates:
            </p>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-700",
              )}
            >
              Latitude: {position[0].toFixed(6)}, Longitude:{" "}
              {position[1].toFixed(6)}
            </p>
          </div>

          {address && (
            <div className="mb-4">
              <p
                className={cn(
                  "mb-1 text-sm font-medium",
                  isDark ? "text-gray-400" : "text-gray-600",
                )}
              >
                Address:
              </p>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-300" : "text-gray-700",
                )}
              >
                {isLoadingAddress ? "Loading address..." : address}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={cn(
                "flex-1 rounded-md px-4 py-2 font-medium transition-colors",
                isDark
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300",
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90 flex-1 rounded-md px-4 py-2 font-medium text-white transition-colors"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
