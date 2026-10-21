// Line-drawing icons ported from the prototype. Each value is the inner SVG markup for a 48x48 viewBox.
const ICONS = {
  book: '<path d="M10 9h22a4 4 0 0 1 4 4v27H14a4 4 0 0 1-4-4z"/><path d="M10 36a4 4 0 0 1 4-4h22"/><path d="M17 16h12M17 21h8"/>',
  desk: '<path d="M6 17h36M9 17v22M39 17v22"/><rect x="26" y="17" width="13" height="12"/><path d="M30 23h5"/><path d="M14 17V9h8v8"/>',
  fridge: '<rect x="13" y="6" width="22" height="36" rx="2"/><path d="M13 17h22M17 10v4M17 21v8"/>',
  headphones: '<path d="M9 30v-6a15 15 0 0 1 30 0v6"/><rect x="7" y="28" width="7" height="12" rx="2"/><rect x="34" y="28" width="7" height="12" rx="2"/>',
  hoodie: '<path d="M17 8c2 4 12 4 14 0l9 6-4 8-4-2v20H16V20l-4 2-4-8z"/><path d="M20 8c0 5 8 5 8 0M21 12v5M27 12v5"/><path d="M19 32h10"/>',
  ticket: '<path d="M6 14h36v6a4 4 0 0 0 0 8v6H6v-6a4 4 0 0 0 0-8z"/><path d="M30 14v20" stroke-dasharray="2 3"/><path d="M13 21h10M13 27h7"/>',
  calculator: '<rect x="12" y="6" width="24" height="36" rx="3"/><rect x="16" y="10" width="16" height="7"/><path d="M17 23h2M23 23h2M29 23h2M17 29h2M23 29h2M29 29h2M17 35h2M23 35h2M29 35h2"/>',
  lamp: '<path d="M14 42h16M22 42V26l10-10"/><path d="M28 10l10 4-6 10z"/><path d="M34 22l2 4"/>',
  bed: '<path d="M6 34V14M6 26h36v8M42 26v-4a4 4 0 0 0-4-4H20v8"/><rect x="9" y="19" width="8" height="6" rx="2"/>',
  monitor: '<rect x="6" y="9" width="36" height="23" rx="2"/><path d="M24 32v6M16 40h16"/>',
  coat: '<path d="M18 7l-9 6v26h9M30 7l9 6v26h-9"/><path d="M18 7l6 7 6-7M24 14v28M18 42h12"/><path d="M13 26h5M30 26h5"/>',
  cart: '<path d="M12 8h24M12 20h24M12 32h24M14 8v28M34 8v28"/><circle cx="15" cy="40" r="2"/><circle cx="33" cy="40" r="2"/>',
  pot: '<path d="M10 20h28v14a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z"/><path d="M8 20h32M20 14h8a2 2 0 0 1 2 2v4H18v-4a2 2 0 0 1 2-2z"/><path d="M16 27h2"/>',
  all: '<rect x="8" y="8" width="13" height="13" rx="2"/><rect x="27" y="8" width="13" height="13" rx="2"/><rect x="8" y="27" width="13" height="13" rx="2"/><rect x="27" y="27" width="13" height="13" rx="2"/>',
  heart: '<path d="M24 40S7 30 7 18a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 12-17 22-17 22z"/>',
  search: '<circle cx="21" cy="21" r="12"/><path d="M30 30l10 10"/>',
  pin: '<path d="M24 42s13-12 13-22a13 13 0 0 0-26 0c0 10 13 22 13 22z"/><circle cx="24" cy="20" r="4"/>',
  check: '<path d="M10 25l9 9 19-20"/>',
  chat: '<path d="M8 10h32v22H20l-8 7v-7H8z"/>',
  tag: '<path d="M6 6h18l18 18-18 18L6 24z"/><circle cx="15" cy="15" r="3"/>',
  user: '<circle cx="24" cy="17" r="8"/><path d="M8 42c2-9 9-13 16-13s14 4 16 13"/>',
  menu: '<path d="M8 14h32M8 24h32M8 34h32"/>',
  map: '<path d="M6 12l12-5 12 5 12-5v29l-12 5-12-5-12 5z"/><path d="M18 7v29M30 12v29"/>',
  close: '<path d="M12 12l24 24M36 12L12 36"/>',
  plus: '<path d="M24 10v28M10 24h28"/>',
  shield: '<path d="M24 6l15 6v11c0 10-7 16-15 19C16 39 9 33 9 23V12z"/><path d="M17 24l5 5 9-10"/>',
  sliders: '<path d="M8 14h20M36 14h4M8 34h6M22 34h18"/><circle cx="32" cy="14" r="4"/><circle cx="18" cy="34" r="4"/>',
  send: '<path d="M6 22L42 7 30 42l-7-14z"/><path d="M23 28L42 7"/>',
  cap: '<path d="M4 18l20-9 20 9-20 9z"/><path d="M12 22v9c0 3 6 5 12 5s12-2 12-5v-9"/><path d="M44 18v11"/>',
  box: '<path d="M6 15l18-8 18 8v19l-18 8-18-8z"/><path d="M6 15l18 8 18-8M24 23v19"/><path d="M15 11l18 8"/>',
  scissors: '<circle cx="13" cy="35" r="5"/><circle cx="35" cy="35" r="5"/><path d="M16 31L36 7M32 31L12 7"/>',
  laptop: '<rect x="10" y="10" width="28" height="19" rx="2"/><path d="M5 36h38l-3-7H8z"/>',
  camera: '<path d="M6 16h8l3-5h14l3 5h8v22H6z"/><circle cx="24" cy="26" r="7"/>',
  lock: '<rect x="10" y="21" width="28" height="20" rx="3"/><path d="M16 21v-6a8 8 0 0 1 16 0v6"/><path d="M24 29v5"/>',
  eye: '<path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="5"/>',
  upload: '<path d="M24 32V10M15 19l9-9 9 9"/><path d="M8 32v6h32v-6"/>',
  chevron: '<path d="M14 19l10 10 10-10"/>',
  logout: '<path d="M20 8H10v32h10"/><path d="M19 24h21M32 16l8 8-8 8"/>',
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, className, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg
      className={className ? `ic ${className}` : "ic"}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // Static, trusted strings defined above, never user input.
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
