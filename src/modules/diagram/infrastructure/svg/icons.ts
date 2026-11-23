import type { IconName } from "@/modules/diagram/domain/scene";

/** Iconos de trazo sobre una caja de 24×24. */
export const ICONS: Record<IconName, string> = {
  server: "M4 5h16v6H4z M4 13h16v6H4z M7.5 8h.01 M7.5 16h.01 M12 8h5 M12 16h5",
  globe:
    "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z M3 12h18 M12 3c3.2 3 3.2 15 0 18 M12 3c-3.2 3-3.2 15 0 18",
  browser: "M3 5h18v14H3z M3 9h18 M6 7h.01 M8.5 7h.01",
  users:
    "M9 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6z M3 19c0-3 3-5 6-5s6 2 6 5 M16 11a2.5 2.5 0 1 0 0-5 M17.5 14.2c2 .6 3.5 2.2 3.5 4.8",
  database:
    "M5 6c0-1.7 3-3 7-3s7 1.3 7 3s-3 3-7 3s-7-1.3-7-3z M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6 M5 12c0 1.7 3 3 7 3s7-1.3 7-3",
  bolt: "M13 3L5 13h6l-1 8l8-10h-6z",
  split: "M3 12h6 M9 12l6-6h5 M9 12l6 6h5 M17.5 3.5L20 6l-2.5 2.5 M17.5 15.5L20 18l-2.5 2.5",
  files: "M8 3h7l4 4v11H8z M15 3v4h4 M5 7v14h10",
  shield: "M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z",
};
