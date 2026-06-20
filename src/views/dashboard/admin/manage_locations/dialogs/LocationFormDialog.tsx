import { type FC, useEffect, useState } from "react";
import exifr from "exifr";
import { useForm, type UseFormReturn, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  X,
  ImageIcon,
  RotateCcw,
  LocateFixed,
  ChevronDown,
  MapPin,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useManageLocationsStore } from "../stores/location_store";
import { getFieldError } from "@/helper/error_handler";
import { getImageUrl } from "@/helper/image_url";
import MapPicker from "./MapPicker";
import ImageDropZone from "./ImageDropZone";

// ── Schema ────────────────────────────────────────────────────────────────────
const chamDiemItem = z.object({
  diem: z.coerce.number().nullable().optional(),
  mo_ta: z.string().optional(),
});

const schema = z.object({
  ten_xa:    z.string().nullable().optional().transform((v) => v ?? ""),
  ten_huyen: z.string().nullable().optional(),
  ten_tinh:  z.string().nullable().optional(),
  lat: z.coerce.number().min(-90).max(90).refine((v) => v !== 0, { message: "Vui lòng nhập vĩ độ hợp lệ (≠ 0)" }),
  lng: z.coerce.number().min(-180).max(180).refine((v) => v !== 0, { message: "Vui lòng nhập kinh độ hợp lệ (≠ 0)" }),
  note: z.string().optional(),
  cham_diem: z.object({
    do_doc:   chamDiemItem.optional(),
    nguy_co:  z.string().optional().transform((v) => v?.trim() || undefined),
    taluy:    chamDiemItem.optional(),
    lop_phu:  chamDiemItem.optional(),
    loai_dat: chamDiemItem.optional(),
  }).optional(),
});

type FormValues = z.infer<typeof schema>;

const CHAM_DIEM_META: {
  key: 'do_doc' | 'nguy_co' | 'taluy' | 'lop_phu' | 'loai_dat';
  label: string;
  quickOptions?: string[];
}[] = [
  { key: "do_doc",   label: "Độ dốc",             quickOptions: ["<15°", "15–30°", ">30°"] },
  { key: "nguy_co",  label: "Mức độ nguy hiểm",   quickOptions: ["thấp", "trung bình", "cao"] },
  { key: "taluy",    label: "Taluy" },
  { key: "lop_phu",  label: "Lớp phủ" },
  { key: "loai_dat", label: "Loại đất" },
];

const LABEL = "#265935";
const BTN_STYLE = { background: "linear-gradient(135deg, #2F6B3F, #3d7a50)" };
const XA_STORAGE_KEY = "loc_default_xa";

const XA_OPTIONS = [
  "Bản Hồ", "Châu Quế", "Chiềng Ken", "Đồng Cuông", "Dương Quỳ",
  "Gia Phú", "Hợp Thành", "Hưng Khánh", "Khánh Yên", "Lâm Giang",
  "Lương Thịnh", "Mậu A", "Minh Lương", "Mỏ Vàng", "Mường Bo",
  "Nậm Chảy", "Nậm Xé", "Phong Dụ Hạ", "Phong Dụ Thượng", "Phường Âu Lâu",
  "Quy Mông", "Tà Van", "Tân Hợp", "Tăng Loỏng", "Trấn Yên",
  "Văn Bàn", "Việt Hồng", "Vò Lao", "Xuân Ái",
];

// ── Sub-components ────────────────────────────────────────────────────────────
const FieldError: FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

const SectionTitle: FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
    {children}
  </p>
);


// ── Image picker ──────────────────────────────────────────────────────────────
interface ImageEntry {
  file: File;
  preview: string;
  caption: string;
  gps?: { lat: number; lng: number };
}

const ImagePicker: FC<{
  entries: ImageEntry[];
  onChange: (entries: ImageEntry[]) => void;
}> = ({ entries, onChange }) => {
  const MAX_FILES    = 10;
  const MAX_MB       = 12;
  const MAX_BYTES    = MAX_MB * 1024 * 1024;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const incoming  = Array.from(files);
    const slots     = MAX_FILES - entries.length;

    const tooBig    = incoming.filter((f) => f.size > MAX_BYTES);
    const valid     = incoming.filter((f) => f.size <= MAX_BYTES).slice(0, slots);
    const overflow  = incoming.filter((f) => f.size <= MAX_BYTES).length - valid.length;

    if (tooBig.length)
      toast.error(`${tooBig.length} ảnh vượt quá ${MAX_MB}MB và bị bỏ qua.`);
    if (overflow > 0)
      toast.error(`Chỉ còn ${slots} ảnh, ${overflow} ảnh bị bỏ qua (tối đa ${MAX_FILES} ảnh).`);

    const next = [...entries];
    for (const file of valid) {
      let gps: ImageEntry["gps"];
      try {
        const data = await exifr.gps(file);
        if (data?.latitude && data?.longitude)
          gps = { lat: data.latitude, lng: data.longitude };
      } catch { /* ảnh không có EXIF hoặc không đọc được */ }
      next.push({ file, preview: URL.createObjectURL(file), caption: "", gps });
    }
    onChange(next);
  };

  const updateCaption = (i: number, caption: string) => {
    const next = [...entries];
    next[i] = { ...next[i], caption };
    onChange(next);
  };

  const remove = (i: number) => {
    URL.revokeObjectURL(entries[i].preview);
    onChange(entries.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <ImageDropZone onFiles={(files) => handleFiles(files)} />

      {/* Preview grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/20 overflow-hidden"
            >
              <div className="relative w-full aspect-video bg-muted">
                <img
                  src={entry.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500/90 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                  {i + 1}
                </span>
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="text-[11px] text-muted-foreground truncate">
                  {entry.file.name}
                </p>
                <textarea
                  rows={3}
                  placeholder="Chú thích ảnh..."
                  value={entry.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B3F]/30 focus:border-[#2F6B3F]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Chưa có ảnh nào được chọn</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
          <span>{entries.length} / 10 ảnh</span>
          <span>{(entries.reduce((s, e) => s + e.file.size, 0) / 1024 / 1024).toFixed(1)} MB / 120 MB</span>
        </div>
      )}
    </div>
  );
};

// ── GPS image slider ──────────────────────────────────────────────────────────
const ImageGpsSlider: FC<{
  images: ImageEntry[];
  onSelectGps: (lat: number, lng: number) => void;
}> = ({ images, onSelectGps }) => {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        GPS từ ảnh — bấm để dùng tọa độ
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => {
          const hasGps = !!img.gps;
          return (
            <button
              key={i}
              type="button"
              disabled={!hasGps}
              onClick={() => img.gps && onSelectGps(img.gps.lat, img.gps.lng)}
              className={`shrink-0 relative rounded-lg overflow-hidden border-2 transition-all focus:outline-none ${
                hasGps
                  ? "border-[#2F6B3F]/50 hover:border-[#2F6B3F] hover:shadow-md cursor-pointer"
                  : "border-border opacity-50 cursor-not-allowed"
              }`}
              style={{ width: 88, height: 66 }}
              title={hasGps ? `${img.gps!.lat.toFixed(6)}, ${img.gps!.lng.toFixed(6)}` : "Ảnh không có GPS"}
            >
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <div
                className={`absolute bottom-0 inset-x-0 px-1 py-0.5 text-center leading-tight ${
                  hasGps ? "bg-[#2F6B3F]/80 text-white" : "bg-black/50 text-white/60"
                }`}
                style={{ fontSize: 8 }}
              >
                {hasGps
                  ? `${img.gps!.lat.toFixed(4)}, ${img.gps!.lng.toFixed(4)}`
                  : "Không có GPS"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Shared form body ──────────────────────────────────────────────────────────
const LocationFormBody: FC<{
  form: UseFormReturn<FormValues, object, FormValues>;
  images: ImageEntry[];
  onImagesChange: (e: ImageEntry[]) => void;
  serverError: (field: string) => string | undefined;
  step: 1 | 2;
  onNext: () => void;
  onBack: () => void;
}> = ({ form, images, onImagesChange, serverError, step, onNext, onBack }) => {
  const {
    register,
    setValue,
    formState: { errors },
  } = form;
  const [locating,      setLocating]      = useState(false);
  const [showChamDiem,  setShowChamDiem]  = useState(false);
  const [xaSearch,      setXaSearch]      = useState("");
  const [coordStr,      setCoordStr]      = useState("");

  const handleCoordStr = (raw: string) => {
    setCoordStr(raw);
    const parts = raw.trim().split(/[,\s]+/).filter(Boolean);
    if (parts.length < 2) return;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isFinite(lat) && isFinite(lng)) {
      setValue("lat", lat, { shouldValidate: true });
      setValue("lng", lng, { shouldValidate: true });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Thiết bị không hỗ trợ định vị GPS");
      return;
    }
    // Geolocation yêu cầu HTTPS — trên HTTP sẽ bị browser chặn
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast.error("Cần HTTPS để lấy vị trí GPS. Vui lòng nhập tọa độ thủ công.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude,  { shouldValidate: true });
        setValue("lng", pos.coords.longitude, { shouldValidate: true });
        setLocating(false);
        toast.success("Đã lấy vị trí hiện tại");
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED)
          toast.error("Bạn chưa cấp quyền truy cập vị trí");
        else toast.error("Không lấy được vị trí, thử lại sau");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Watch tất cả một lần, tránh gọi watch() bên trong .map() ──
  const watchedXa       = form.watch("ten_xa");
  const watchedChamDiem = form.watch("cham_diem");
  const watchedLat      = form.watch("lat");
  const watchedLng      = form.watch("lng");

  // ── Step 1: chọn xã ──────────────────────────────────────────────────────
  if (step === 1) {
    const norm = (s: string) =>
      s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const filtered = XA_OPTIONS.filter((xa) => norm(xa).includes(norm(xaSearch)));
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Chọn Xã / Phường
          </p>
          <input
            autoFocus
            type="text"
            placeholder="Tìm xã..."
            value={xaSearch}
            onChange={(e) => setXaSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            className="w-full mb-3 px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2F6B3F]/30 focus:border-[#2F6B3F]"
          />
          <div className="flex flex-wrap gap-2 max-h-[55vh] sm:max-h-64 overflow-y-auto pr-1">
            {filtered.map((xa) => {
              const active = watchedXa === xa;
              return (
                <button
                  key={xa}
                  type="button"
                  onClick={() => {
                    setValue("ten_xa", xa, { shouldValidate: true });
                    localStorage.setItem(XA_STORAGE_KEY, xa);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    active
                      ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-sm"
                      : "border-border text-foreground hover:border-[#2F6B3F]/60 hover:bg-[#2F6B3F]/5"
                  }`}
                >
                  {xa}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 w-full text-center">Không tìm thấy xã</p>
            )}
          </div>
        </div>

        {watchedXa && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2F6B3F]/5 border border-[#2F6B3F]/20">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2F6B3F]" />
            <span className="text-sm font-medium text-[#2F6B3F]">{watchedXa}</span>
          </div>
        )}

        <Button
          type="button"
          disabled={!watchedXa}
          onClick={onNext}
          className="w-full gap-2 text-white"
          style={BTN_STYLE}
        >
          Tiếp theo <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Xã đã chọn */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#2F6B3F]/5 border border-[#2F6B3F]/20">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#2F6B3F] shrink-0" />
          <span className="text-sm font-medium text-[#2F6B3F]">{watchedXa || "—"}</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-[#2F6B3F] transition-colors"
        >
          Đổi xã
        </button>
      </div>

      {/* Tọa độ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Tọa độ GPS</SectionTitle>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-[#2F6B3F]/30 text-[#2F6B3F] hover:bg-[#2F6B3F]/5 disabled:opacity-50 transition-colors"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            {locating ? "Đang lấy..." : "Vị trí hiện tại"}
          </button>
        </div>
        <div className="mb-3 space-y-1.5">
          <label className="text-sm font-medium" style={{ color: LABEL }}>Dán tọa độ nhanh</label>
          <Input
            type="text"
            placeholder="21.620181,104.757602"
            value={coordStr}
            onChange={(e) => handleCoordStr(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">Nhập hoặc dán chuỗi lat,lng — tự động tách vào 2 ô bên dưới</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: LABEL }}>Vĩ độ (Lat)</label>
            <Input type="number" step="any" placeholder="21.74993622" {...register("lat")} />
            <FieldError message={errors.lat?.message ?? serverError("toa_do.lat")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: LABEL }}>Kinh độ (Lng)</label>
            <Input type="number" step="any" placeholder="104.26313864" {...register("lng")} />
            <FieldError message={errors.lng?.message ?? serverError("toa_do.lng")} />
          </div>
        </div>

        <MapPicker
          lat={watchedLat}
          lng={watchedLng}
          onChange={(lat, lng) => {
            setValue("lat", lat, { shouldValidate: true });
            setValue("lng", lng, { shouldValidate: true });
          }}
        />

        <ImageGpsSlider
          images={images}
          onSelectGps={(lat, lng) => {
            setValue("lat", lat, { shouldValidate: true });
            setValue("lng", lng, { shouldValidate: true });
          }}
        />
      </div>

      {/* Ghi chú */}
      <div className="space-y-1.5">
        <SectionTitle>Ghi chú</SectionTitle>
        <textarea
          rows={3}
          placeholder="Mô tả điểm nguy cơ, vị trí cụ thể trên tuyến đường..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B3F]/30 focus:border-[#2F6B3F]"
          {...register("note")}
        />
      </div>

      {/* Chấm điểm */}
      <div>
        <button
          type="button"
          onClick={() => setShowChamDiem((v) => !v)}
          className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-[#2F6B3F]/50 hover:text-[#2F6B3F] hover:bg-[#2F6B3F]/5 transition-all"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showChamDiem ? '' : '-rotate-90'}`} />
          {showChamDiem ? 'Ẩn chấm điểm' : 'Thêm chấm điểm (Độ dốc, Nguy cơ, Taluy...)'}
        </button>

        {showChamDiem && <div className="space-y-3 mt-3">
          {CHAM_DIEM_META.map(({ key, label, quickOptions }) => {
            const isStringField = key === "nguy_co";

            // Đọc từ watchedChamDiem đã watch 1 lần bên ngoài, tránh gọi watch() trong loop
            const fieldVal = watchedChamDiem?.[key];
            const currentValue = isStringField
              ? (typeof fieldVal === "string" ? fieldVal : "")
              : (fieldVal && typeof fieldVal === "object" ? (fieldVal as { mo_ta?: string }).mo_ta ?? "" : "");

            return (
              <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm font-medium" style={{ color: LABEL }}>{label}</p>

                {/* Quick option buttons */}
                {quickOptions && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickOptions.map((opt) => {
                      const active = currentValue === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (isStringField) {
                              setValue("cham_diem.nguy_co", opt, { shouldValidate: true });
                            } else {
                              setValue(`cham_diem.${key}.mo_ta` as `cham_diem.do_doc.mo_ta`, opt, { shouldValidate: true });
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            active
                              ? "bg-[#2F6B3F] text-white border-[#2F6B3F]"
                              : "border-border text-muted-foreground hover:border-[#2F6B3F]/50 hover:text-[#2F6B3F]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Textarea — chỉ với field không phải nguy_co */}
                {!isStringField && (
                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      placeholder={`Mô tả tiêu chí ${label.toLowerCase()}...`}
                      {...register(`cham_diem.${key}.mo_ta` as `cham_diem.do_doc.mo_ta`)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B3F]/30 focus:border-[#2F6B3F]"
                    />
                    <FieldError
                      message={(errors.cham_diem as Record<string, { mo_ta?: { message?: string } }>)?.[key]?.mo_ta?.message ?? serverError(`cham_diem.${key}.mo_ta`)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>

      {/* Ảnh */}
      <div>
        <SectionTitle>Hình ảnh</SectionTitle>
        <ImagePicker entries={images} onChange={onImagesChange} />
      </div>
    </div>
  );
};

// ── Create ────────────────────────────────────────────────────────────────────
export const CreateLocationDialog: FC = () => {
  const {
    dialogMode,
    isMutating,
    error,
    createLocation,
    closeDialog,
    clearError,
  } = useManageLocationsStore();
  const open = dialogMode === "create";

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [step,   setStep]   = useState<1 | 2>(() => localStorage.getItem(XA_STORAGE_KEY) ? 2 : 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      ten_xa:    localStorage.getItem(XA_STORAGE_KEY) ?? "",
      ten_huyen: "",
      ten_tinh:  "",
      lat:       undefined,
      lng:       undefined,
      note:      "",
      cham_diem: {
        do_doc:   { diem: undefined, mo_ta: "" },
        nguy_co:  "",
        taluy:    { diem: undefined, mo_ta: "" },
        lop_phu:  { diem: undefined, mo_ta: "" },
        loai_dat: { diem: undefined, mo_ta: "" },
      },
    },
  }) as unknown as UseFormReturn<FormValues, object, FormValues>;

  const handleClose = () => {
    const savedXa = localStorage.getItem(XA_STORAGE_KEY) ?? "";
    form.reset({
      ten_xa:    savedXa,
      ten_huyen: "",
      ten_tinh:  "",
      lat:       undefined,
      lng:       undefined,
      note:      "",
      cham_diem: {
        do_doc:   { diem: undefined, mo_ta: "" },
        nguy_co:  "",
        taluy:    { diem: undefined, mo_ta: "" },
        lop_phu:  { diem: undefined, mo_ta: "" },
        loai_dat: { diem: undefined, mo_ta: "" },
      },
    });
    images.forEach((e) => URL.revokeObjectURL(e.preview));
    setImages([]);
    setStep(savedXa ? 2 : 1);
    closeDialog();
  };

  const onSubmit = async (values: FormValues) => {
    clearError();
    const payload = {
      ten_xa:    values.ten_xa ?? "",
      ten_huyen: values.ten_huyen,
      ten_tinh:  values.ten_tinh,
      toa_do:    { lat: values.lat, lng: values.lng },
      note:      values.note || undefined,
      cham_diem: values.cham_diem,
      images:    images.map((e) => e.file),
      captions:  images.map((e) => e.caption),
    };
    console.log("[CreateLocation] payload:", payload);
    const ok = await createLocation(payload);
    if (ok) handleClose();
  };

  const sf = (field: string) => getFieldError(error, field);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle style={{ color: "#1e4429" }}>Thêm địa điểm mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1">
            {error && !error.errors?.length && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">
                {error.message}
              </div>
            )}
            <LocationFormBody
              form={form}
              images={images}
              onImagesChange={setImages}
              serverError={sf}
              step={step}
              onNext={() => setStep(2)}
              onBack={() => setStep(1)}
            />
          </div>
          {step === 2 && (
            <DialogFooter className="shrink-0 mt-0 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isMutating}>
                Hủy
              </Button>
              <Button type="submit" disabled={isMutating} className="gap-2 text-white" style={BTN_STYLE}>
                {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isMutating ? "Đang lưu..." : "Thêm địa điểm"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Edit ──────────────────────────────────────────────────────────────────────
export const EditLocationDialog: FC = () => {
  const {
    dialogMode,
    selected,
    isMutating,
    error,
    updateLocation,
    closeDialog,
    clearError,
  } = useManageLocationsStore();
  const open = dialogMode === "edit";

  const [images,      setImages]      = useState<ImageEntry[]>([]);
  const [deletedUrls, setDeletedUrls] = useState<Set<string>>(new Set());
  const [step,        setStep]        = useState<1 | 2>(2);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  }) as unknown as UseFormReturn<FormValues, object, FormValues>;

  useEffect(() => {
    if (open && selected) {
      const cd = selected.cham_diem;
      form.reset({
        ten_xa:    selected.ten_xa,
        ten_huyen: selected.ten_huyen,
        ten_tinh:  selected.ten_tinh,
        lat:       selected.toa_do.lat,
        lng:       selected.toa_do.lng,
        note:      selected.note ?? "",
        cham_diem: {
          do_doc:   { diem: cd?.do_doc?.diem,   mo_ta: cd?.do_doc?.mo_ta },
          nguy_co:  cd?.nguy_co ?? "",          // ← plain string
          taluy:    { diem: cd?.taluy?.diem,     mo_ta: cd?.taluy?.mo_ta },
          lop_phu:  { diem: cd?.lop_phu?.diem,   mo_ta: cd?.lop_phu?.mo_ta },
          loai_dat: { diem: cd?.loai_dat?.diem,  mo_ta: cd?.loai_dat?.mo_ta },
        },
      });
    }
  }, [open, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDelete = (url: string) => {
    setDeletedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleClose = () => {
    images.forEach((e) => URL.revokeObjectURL(e.preview));
    setImages([]);
    setDeletedUrls(new Set());
    setStep(2);
    closeDialog();
  };

  const sf = (field: string) => getFieldError(error, field);
  const existingImages = selected?.images ?? [];

  const onSubmit = async (values: FormValues) => {
    if (!selected) return;
    clearError();
    const keptImages = existingImages.filter((img) => !deletedUrls.has(img.url));
    const ok = await updateLocation(selected._id, {
      ten_xa:          values.ten_xa,
      ten_huyen:       values.ten_huyen ?? null,
      ten_tinh:        values.ten_tinh ?? null,
      toa_do:          { lat: values.lat, lng: values.lng },
      note:            values.note || undefined,
      cham_diem:       values.cham_diem,
      images:          images.map((e) => e.file),
      captions:        images.map((e) => e.caption),
      existing_images: keptImages,
    });
    if (ok) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle style={{ color: "#1e4429" }}>Chỉnh sửa địa điểm</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1">
            {error && !error.errors?.length && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">
                {error.message}
              </div>
            )}
          <div className="space-y-5">
            <LocationFormBody
              form={form}
              images={images}
              onImagesChange={setImages}
              serverError={sf}
              step={step}
              onNext={() => setStep(2)}
              onBack={() => setStep(1)}
            />

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <SectionTitle>
                  Ảnh hiện có
                  {deletedUrls.size > 0 && (
                    <span className="ml-2 text-red-500 normal-case font-normal">
                      — {deletedUrls.size} ảnh sẽ bị xóa
                    </span>
                  )}
                </SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {existingImages.map((img, i) => {
                    const isDeleted = deletedUrls.has(img.url);
                    return (
                      <div
                        key={i}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isDeleted ? "border-red-300 opacity-50" : "border-border"
                        }`}
                      >
                        <div className="relative w-full aspect-video bg-muted">
                          <img
                            src={getImageUrl(img.url)}
                            alt={img.caption ?? ""}
                            className="w-full h-full object-cover"
                          />
                          {isDeleted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 pointer-events-none">
                              <span className="text-[11px] font-medium text-red-600 bg-white/80 px-2 py-0.5 rounded">
                                Sẽ xóa
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleDelete(img.url)}
                            className={`absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full text-white flex items-center justify-center transition-colors ${
                              isDeleted
                                ? "bg-green-500/90 hover:bg-green-600"
                                : "bg-black/60 hover:bg-red-500/90"
                            }`}
                          >
                            {isDeleted ? (
                              <RotateCcw className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                            {i + 1}
                          </span>
                        </div>
                        {img.caption && (
                          <div className="px-2.5 py-1.5">
                            <p className="text-[11px] text-muted-foreground">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </div>

          {step === 2 && (
            <DialogFooter className="shrink-0 mt-0 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isMutating}>
                Hủy
              </Button>
              <Button type="submit" disabled={isMutating} className="gap-2 text-white" style={BTN_STYLE}>
                {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isMutating ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};