import type { ReactNode } from "react";

export default function HeaderComponent({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
      <div className="h-px w-full bg-border mt-4" />
    </div>
  );
}
