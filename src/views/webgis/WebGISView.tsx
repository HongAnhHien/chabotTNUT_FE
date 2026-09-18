import { type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

// WebGIS Atlas TNUT — nhúng ứng dụng bản đồ số thật (atlas-tnut.html, MapLibre, dữ liệu inline)
// đặt tại public/webgis/. Toàn màn hình + nút quay về hub Atlas.
const WEBGIS_SRC = "/webgis/atlas-tnut.html";

const WebGISView: FC = () => {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0b1220" }}>
      <iframe
        title="WebGIS Atlas TNUT"
        src={WEBGIS_SRC}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        allow="fullscreen; geolocation"
      />
      <Link
        to="/atlas"
        title="Về hệ sinh thái Atlas"
        style={{
          position: "absolute", top: 12, left: 12, zIndex: 50,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 10,
          background: "rgba(15,23,42,.82)", color: "#fff",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          boxShadow: "0 6px 18px -6px rgba(0,0,0,.5)",
          backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.14)",
        }}
      >
        <ArrowLeft size={15} /> Về Atlas
      </Link>
    </div>
  );
};

export default WebGISView;
