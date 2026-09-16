import { type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, MapPin, Layers, Home, School } from "lucide-react";

// Bản đồ nền quanh Trường ĐH Kỹ thuật Công nghiệp Thái Nguyên (TNUT).
const CENTER = { lat: 21.5615, lon: 105.829 };
const BBOX = "105.782,21.512,105.876,21.611"; // minLon,minLat,maxLon,maxLat
const OSM = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${CENTER.lat},${CENTER.lon}`;

const LAYERS = [
  { icon: School, label: "Cơ sở TNUT", color: "text-teal-600", note: "Điểm trường, giảng đường" },
  { icon: Home, label: "Ngoại trú", color: "text-amber-600", note: "Phân bố SV ở trọ ngoài trường" },
  { icon: MapPin, label: "Nội trú (KTX)", color: "text-indigo-600", note: "Toà nhà ký túc xá" },
];

const WebGISView: FC = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/atlas" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-teal-600" /> WebGIS Atlas TNUT</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bản đồ số của hệ sinh thái: cơ sở TNUT · phân bố sinh viên ngoại trú · ký túc xá.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800" style={{ height: "62vh", minHeight: 380 }}>
            <iframe
              title="WebGIS Atlas TNUT"
              src={OSM}
              className="h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Bản đồ nền OpenStreetMap quanh TNUT (Thái Nguyên). Lớp dữ liệu SV/ngoại trú/KTX sẽ được phủ lên khi nạp toạ độ thật.
          </p>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-teal-600" /> Lớp bản đồ</p>
            <div className="space-y-2">
              {LAYERS.map((l) => (
                <label key={l.label} className="flex items-start gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-sm dark:border-slate-800">
                  <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-teal-600" />
                  <span>
                    <span className={`flex items-center gap-1.5 font-medium ${l.color}`}><l.icon className="h-3.5 w-3.5" /> {l.label}</span>
                    <span className="text-xs text-slate-400">{l.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            <b>Ghi chú:</b> Đây là nền WebGIS khởi tạo. Bước tiếp: nạp toạ độ ngoại trú (từ CSDL nội/ngoại trú) và vẽ marker/heatmap bằng thư viện bản đồ (Leaflet/MapLibre) — theo NĐ13 khi hiển thị vị trí SV.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WebGISView;
