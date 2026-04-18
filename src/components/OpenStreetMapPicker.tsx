import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

interface OpenStreetMapPickerProps {
  onAddressSelect: (address: AddressFromMap) => void;
  defaultLocation?: { lat: number; lng: number };
}

const DEFAULT_CENTER = {
  lat: 10.7769,
  lng: 106.7009 // Ho Chi Minh City, Vietnam
};

// Search component using Nominatim
function SearchControl({ onAddressSelect }: { onAddressSelect: (addr: AddressFromMap) => void }) {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const map = useMap();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&countrycodes=vn`
      );
      const results = await response.json();
      setSuggestions(results);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Lỗi tìm kiếm địa chỉ');
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
      }
    }, 300); // Debounce 300ms
  };

  const handleSelectSuggestion = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    // Zoom to selected location
    map.setView([lat, lng], 17);
    setSearchInput('');
    setSuggestions([]);

    // Reverse geocode to get structured address
    await reverseGeocodeAddress(lat, lng, address, onAddressSelect);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-72">
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm địa chỉ..."
          value={searchInput}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:ring-2 focus:ring-primary outline-none font-bold shadow-lg"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-xl z-[1001] max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-border/50 last:border-0 transition-colors text-sm"
              >
                <p className="font-bold text-xs">{suggestion.display_name.split(',')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{suggestion.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Reverse geocode function
async function reverseGeocodeAddress(
  lat: number,
  lng: number,
  displayAddress: string,
  onAddressSelect: (addr: AddressFromMap) => void
) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();

    const address = data.address || {};
    const addressData: AddressFromMap = {
      streetAddress: `${address.house_number || ''} ${address.road || address.pedestrian || address.path || ''}`.trim() || displayAddress.split(',')[0],
      ward: address.suburb || address.hamlet || address.village || '',
      district: address.city_district || address.county || address.city || '',
      province: address.state || address.province || 'Việt Nam',
      fullAddress: displayAddress || data.display_name || '',
      latitude: lat,
      longitude: lng
    };

    onAddressSelect(addressData);
    toast.success('Địa chỉ đã được chọn');
  } catch (err) {
    console.error('Reverse geocode error:', err);
    // Fallback: parse the display address
    const parts = displayAddress.split(',').map((p) => p.trim());
    const addressData: AddressFromMap = {
      streetAddress: parts[0] || '',
      ward: parts[1] || '',
      district: parts[2] || '',
      province: parts[3] || 'Việt Nam',
      fullAddress: displayAddress,
      latitude: lat,
      longitude: lng
    };
    onAddressSelect(addressData);
    toast.success('Địa chỉ đã được chọn');
  }
}

// Map click handler component
function MapClicker({ onAddressSelect }: { onAddressSelect: (addr: AddressFromMap) => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Move marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup('Địa chỉ đã chọn');
      markerRef.current.openPopup();

      // Reverse geocode
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();

        const address = data.address || {};
        const displayAddress = data.display_name || '';

        const addressData: AddressFromMap = {
          streetAddress: `${address.house_number || ''} ${address.road || address.pedestrian || address.path || ''}`.trim() || displayAddress.split(',')[0],
          ward: address.suburb || address.hamlet || address.village || '',
          district: address.city_district || address.county || address.city || '',
          province: address.state || address.province || 'Việt Nam',
          fullAddress: displayAddress,
          latitude: lat,
          longitude: lng
        };

        onAddressSelect(addressData);
        toast.success('Địa chỉ đã được chọn');
      } catch (err) {
        console.error('Map click geocode error:', err);
        toast.error('Không thể lấy thông tin địa chỉ');
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onAddressSelect]);

  return null;
}

export default function OpenStreetMapPicker({ onAddressSelect, defaultLocation }: OpenStreetMapPickerProps) {
  const mapCenter = defaultLocation || DEFAULT_CENTER;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-lg">
      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={15} style={{ height: '400px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
        <SearchControl onAddressSelect={onAddressSelect} />
        <MapClicker onAddressSelect={onAddressSelect} />
      </MapContainer>

      <p className="absolute bottom-4 left-4 right-4 text-xs text-white font-bold bg-black/50 p-3 rounded-lg z-[500]">
        💡 Gợi ý: Tìm kiếm địa chỉ hoặc nhấp trực tiếp trên bản đồ để chọn vị trí
      </p>
    </div>
  );
}
