import { type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, Map as MapIcon } from "lucide-react";

// WebGIS Atlas TNUT — phân hệ ứng dụng AI của hệ sinh thái. Nhúng app bản đồ thật
// (atlas-tnut.html: MapLibre, dữ liệu inline, tab "HỎI AI") đặt tại public/webgis/,
// khoác cùng khung gradient của Atlas hub cho đồng bộ.
const WEBGIS_SRC = "/webgis/atlas-tnut.html";

const WebGISView: FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0b1220" }}>
      {/* Thanh khung gradient — đồng bộ Atlas hub; nút Về Atlas ở đây, không đè logo bản đồ */}
      <header
        style={{
          position: "relative", flexShrink: 0, overflow: "hidden", color: "#fff",
          background: "linear-gradient(135deg,#4f46e5 0%,#6d28d9 44%,#0e7490 100%)",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
            background:
              "radial-gradient(24rem 12rem at 10% 0%, rgba(255,255,255,.22), transparent 60%)," +
              "radial-gradient(22rem 14rem at 95% 130%, rgba(20,184,166,.45), transparent 55%)",
          }}
        />
        <div
          style={{
            position: "relative", zIndex: 1, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, padding: "10px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span
              style={{
                display: "grid", placeItems: "center", height: 38, width: 38, borderRadius: 11,
                background: "rgba(255,255,255,.15)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
                flexShrink: 0,
              }}
            >
              <MapIcon size={19} />
            </span>
            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.01em" }}>
                WebGIS Atlas TNUT
              </div>
              <div
                style={{
                  fontSize: 11.5, color: "rgba(255,255,255,.78)", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                Bản đồ số khuôn viên + trợ lý AI · Hệ sinh thái PIAI-TNUT
              </div>
            </div>
          </div>
          <Link
            to="/atlas"
            title="Về hệ sinh thái Atlas"
            style={{
              flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 13px", borderRadius: 10, textDecoration: "none",
              background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(6px)",
            }}
          >
            <ArrowLeft size={15} /> Về Atlas
          </Link>
        </div>
      </header>

      {/* Bản đồ chiếm phần còn lại */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <iframe
          title="WebGIS Atlas TNUT"
          src={WEBGIS_SRC}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="fullscreen; geolocation"
        />
      </div>
    </div>
  );
};

export default WebGISView;
