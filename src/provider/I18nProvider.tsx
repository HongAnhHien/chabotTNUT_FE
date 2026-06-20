import type { ReactNode } from "react";
import "./i18n/config"; // side-effect: initialise i18next

export default function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
