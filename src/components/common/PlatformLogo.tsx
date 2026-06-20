import facebookLogo  from "@/assets/logo_social/facebook.png";
import instagramLogo from "@/assets/logo_social/instagram.png";
import lazadaLogo    from "@/assets/logo_social/lazada.png";
import shopeeLogo    from "@/assets/logo_social/shopee.png";
import tiktokLogo    from "@/assets/logo_social/tiktok.png";

export type PlatformKey = "facebook" | "instagram" | "tiktok" | "shopee" | "lazada";

const logoMap: Record<PlatformKey, string> = {
  facebook:  facebookLogo,
  instagram: instagramLogo,
  lazada:    lazadaLogo,
  shopee:    shopeeLogo,
  tiktok:    tiktokLogo,
};

interface PlatformLogoProps {
  platform: PlatformKey;
  /** chiều cao hiển thị, mặc định 20px */
  height?: number;
  className?: string;
}

export default function PlatformLogo({ platform, height = 20, className }: PlatformLogoProps) {
  const src = logoMap[platform];
  // ratio gốc 600:200 = 3:1
  return (
    <img
      src={src}
      alt={platform}
      style={{ height, width: height * 3 }}
      className={`object-contain select-none ${className ?? ""}`}
      draggable={false}
    />
  );
}
