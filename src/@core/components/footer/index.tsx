import { type FC } from 'react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  companyName?: string;
  year?: number;
  links?: FooterLink[];
  showMadeWith?: boolean;
  madeByName?: string;
}

export const Footer: FC<FooterProps> = ({
  companyName = 'Company',
  year = new Date().getFullYear(),
  links = [],
  showMadeWith,
  madeByName,
}) => {
  return (
    <footer className="px-6 py-4 text-sm opacity-70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>© {year} {companyName}</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </a>
          ))}
        </div>
        {showMadeWith && madeByName && (
          <span>Made with ❤️ by {madeByName}</span>
        )}
      </div>
    </footer>
  );
};
