import { useCallback, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

export interface AddressFromMap {
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapsPickerProps {
  onAddressSelect: (address: AddressFromMap) => void;
  defaultLocation?: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
};

const DEFAULT_CENTER = {
  lat: 10.7769,
  lng: 106.7009 // Ho Chi Minh City, Vietnam
};

export default function GoogleMapsPicker({ onAddressSelect, defaultLocation }: GoogleMapsPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const [center, setCenter] = useState(defaultLocation || DEFAULT_CENTER);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    defaultLocation || null
  );
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useState<google.maps.Map | null>(null)[1];

  const onSearchBoxLoad = useCallback(
    (ref: google.maps.places.SearchBox) => {
      setSearchBox(ref);
    },
    []
  );

  const onPlacesChanged = useCallback(async () => {
    if (!searchBox) return;

    const places = searchBox.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];

      if (!place.geometry || !place.geometry.location) {
        toast.error('Không thể lấy tọa độ địa điểm này');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newCenter = { lat, lng };

      setCenter(newCenter);
      setSelectedLocation(newCenter);

      // Extract address components
      const addressComponents = place.address_components || [];
      const formattedAddress = place.formatted_address || '';

      let streetAddress = '';
      let ward = '';
      let district = '';
      let province = '';

      // Parse address components
      addressComponents.forEach((component) => {
        const types = component.types;
        const longName = component.long_name;
        const shortName = component.short_name;

        if (types.includes('street_number')) {
          streetAddress = longName;
        } else if (types.includes('route')) {
          streetAddress = streetAddress ? `${streetAddress} ${longName}` : longName;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          ward = longName;
        } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          district = longName;
        } else if (types.includes('administrative_area_level_1')) {
          province = longName;
        }
      });

      // Fallback parsing if components not properly extracted
      if (!streetAddress && !ward && !district) {
        const parts = formattedAddress.split(',').map((p) => p.trim());
        if (parts.length >= 1) streetAddress = parts[0];
        if (parts.length >= 2) ward = parts[1];
        if (parts.length >= 3) district = parts[2];
        if (parts.length >= 4) province = parts[3];
      }

      const addressData: AddressFromMap = {
        streetAddress: streetAddress || formattedAddress.split(',')[0],
        ward: ward || '',
        district: district || '',
        province: province || 'Việt Nam',
        fullAddress: formattedAddress,
        latitude: lat,
        longitude: lng
      };

      onAddressSelect(addressData);
      toast.success('Địa chỉ đã được chọn');
      setSearchInput('');
    }
  }, [searchBox, onAddressSelect]);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newLocation = { lat, lng };

    setSelectedLocation(newLocation);
    setCenter(newLocation);

    // Use Geocoder to get address from coordinates
    const geocoder = new google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: new google.maps.LatLng(lat, lng) });
      if (response.results && response.results.length > 0) {
        const place = response.results[0];
        const addressComponents = place.address_components || [];
        const formattedAddress = place.formatted_address || '';

        let streetAddress = '';
        let ward = '';
        let district = '';
        let province = '';

        addressComponents.forEach((component) => {
          const types = component.types;
          const longName = component.long_name;

          if (types.includes('street_number')) {
            streetAddress = longName;
          } else if (types.includes('route')) {
            streetAddress = streetAddress ? `${streetAddress} ${longName}` : longName;
          } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            ward = longName;
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            district = longName;
          } else if (types.includes('administrative_area_level_1')) {
            province = longName;
          }
        });

        if (!streetAddress && !ward && !district) {
          const parts = formattedAddress.split(',').map((p) => p.trim());
          if (parts.length >= 1) streetAddress = parts[0];
          if (parts.length >= 2) ward = parts[1];
          if (parts.length >= 3) district = parts[2];
          if (parts.length >= 4) province = parts[3];
        }

        const addressData: AddressFromMap = {
          streetAddress: streetAddress || formattedAddress.split(',')[0],
          ward: ward || '',
          district: district || '',
          province: province || 'Việt Nam',
          fullAddress: formattedAddress,
          latitude: lat,
          longitude: lng
        };

        onAddressSelect(addressData);
        toast.success('Địa chỉ đã được chọn');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      toast.error('Không thể lấy thông tin địa điểm');
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-secondary rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground font-bold">Đang tải bản đồ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
        <StandaloneSearchBox onLoad={onSearchBoxLoad} onPlacesChanged={onPlacesChanged}>
          <input
            type="text"
            placeholder="Tìm kiếm địa chỉ trên Google Maps..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
          />
        </StandaloneSearchBox>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onClick={handleMapClick}
        options={{
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false
        }}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            title="Địa chỉ đã chọn"
            onClick={() => {
              toast.info('Nhấp lại trên bản đồ để thay đổi vị trí');
            }}
          />
        )}
      </GoogleMap>

      <p className="text-xs text-muted-foreground font-bold">
        💡 Gợi ý: Tìm kiếm địa chỉ hoặc nhấp trực tiếp trên bản đồ để chọn vị trí
      </p>
    </div>
  );
}
