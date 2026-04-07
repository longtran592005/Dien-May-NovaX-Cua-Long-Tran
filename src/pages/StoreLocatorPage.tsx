import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

interface Store {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const stores: Store[] = [
  { id: "s1", name: "NovaX Quận 1", address: "123 Nguyễn Huệ, Phường Bến Nghé", district: "Quận 1", city: "TP. Hồ Chí Minh", phone: "028 1234 5678", hours: "8:00 - 21:30", lat: 10.7769, lng: 106.7009 },
  { id: "s2", name: "NovaX Quận 7", address: "456 Nguyễn Thị Thập, Phường Tân Phong", district: "Quận 7", city: "TP. Hồ Chí Minh", phone: "028 2345 6789", hours: "8:00 - 21:30", lat: 10.7355, lng: 106.7218 },
  { id: "s3", name: "NovaX Thủ Đức", address: "789 Võ Văn Ngân, Phường Linh Chiểu", district: "TP. Thủ Đức", city: "TP. Hồ Chí Minh", phone: "028 3456 7890", hours: "8:00 - 21:00", lat: 10.8506, lng: 106.7720 },
  { id: "s4", name: "NovaX Hà Nội - Cầu Giấy", address: "321 Cầu Giấy, Phường Dịch Vọng", district: "Cầu Giấy", city: "Hà Nội", phone: "024 1234 5678", hours: "8:00 - 21:30", lat: 21.0306, lng: 105.7986 },
  { id: "s5", name: "NovaX Hà Nội - Đống Đa", address: "654 Tây Sơn, Phường Trung Liệt", district: "Đống Đa", city: "Hà Nội", phone: "024 2345 6789", hours: "8:00 - 21:00", lat: 21.0076, lng: 105.8274 },
  { id: "s6", name: "NovaX Đà Nẵng", address: "987 Nguyễn Văn Linh, Phường Nam Dương", district: "Hải Châu", city: "Đà Nẵng", phone: "0236 123 4567", hours: "8:00 - 21:00", lat: 16.0678, lng: 108.2208 },
];

const cities = ["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"];

const StoreLocatorPage = () => {
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const filteredStores = selectedCity === "Tất cả" ? stores : stores.filter(s => s.city === selectedCity);

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Hệ thống cửa hàng</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Hệ thống cửa hàng NovaX</h1>

      {/* City filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {cities.map(city => (
          <button key={city} onClick={() => { setSelectedCity(city); setSelectedStore(null); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCity === city ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'}`}>
            {city}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Store list */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredStores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={`w-full text-left bg-card rounded-xl border p-4 transition-all ${selectedStore?.id === store.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
            >
              <h3 className="font-bold text-sm mb-1">{store.name}</h3>
              <p className="text-xs text-muted-foreground flex items-start gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {store.address}, {store.district}, {store.city}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {store.phone}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {store.hours}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Map placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border overflow-hidden h-[600px] relative">
            {selectedStore ? (
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-lg">{selectedStore.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedStore.address}</p>
                    <p className="text-sm text-muted-foreground">{selectedStore.district}, {selectedStore.city}</p>
                    <div className="mt-4 flex gap-3 justify-center">
                      <a
                        href={`https://www.google.com/maps?q=${selectedStore.lat},${selectedStore.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                      >
                        <Navigation className="w-4 h-4" /> Chỉ đường
                      </a>
                      <a href={`tel:${selectedStore.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Phone className="w-4 h-4" /> Gọi ngay
                      </a>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /> Giờ mở cửa: <strong className="text-foreground">{selectedStore.hours}</strong></span>
                    <span className="text-success font-medium text-xs px-2 py-0.5 rounded-full bg-success/10">● Đang mở cửa</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Chọn một cửa hàng để xem chi tiết</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocatorPage;
