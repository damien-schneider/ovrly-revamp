// Google Fonts metadata for the font picker
// Fonts are categorized and sorted by popularity

export interface GoogleFont {
  family: string;
  category: "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
  variants: string[];
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans-Serif (most popular first)
  {
    family: "Inter",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Roboto", category: "sans-serif", variants: ["400", "500", "700"] },
  {
    family: "Open Sans",
    category: "sans-serif",
    variants: ["400", "600", "700"],
  },
  { family: "Lato", category: "sans-serif", variants: ["400", "700"] },
  {
    family: "Montserrat",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Poppins",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Nunito", category: "sans-serif", variants: ["400", "600", "700"] },
  {
    family: "Nunito Sans",
    category: "sans-serif",
    variants: ["400", "600", "700"],
  },
  {
    family: "Raleway",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Ubuntu", category: "sans-serif", variants: ["400", "500", "700"] },
  {
    family: "Work Sans",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Rubik",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Quicksand",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Mulish",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Manrope",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "DM Sans",
    category: "sans-serif",
    variants: ["400", "500", "700"],
  },
  {
    family: "Outfit",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Space Grotesk",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Lexend",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Figtree",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Geist",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Sora",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Red Hat Display",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Barlow",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Oswald",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Karla",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Cabin",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Archivo",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Exo 2",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Titillium Web",
    category: "sans-serif",
    variants: ["400", "600", "700"],
  },
  {
    family: "Arimo",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Hind",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Kanit",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Overpass",
    category: "sans-serif",
    variants: ["400", "600", "700"],
  },
  {
    family: "Asap",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Oxygen", category: "sans-serif", variants: ["400", "700"] },
  {
    family: "Catamaran",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Varela Round", category: "sans-serif", variants: ["400"] },
  {
    family: "Signika",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Maven Pro",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Assistant",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Comfortaa",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Prompt",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Questrial", category: "sans-serif", variants: ["400"] },
  {
    family: "IBM Plex Sans",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Source Sans 3",
    category: "sans-serif",
    variants: ["400", "600", "700"],
  },
  {
    family: "Noto Sans",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "PT Sans", category: "sans-serif", variants: ["400", "700"] },
  {
    family: "Mukta",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
  },

  // Serif
  {
    family: "Playfair Display",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Merriweather", category: "serif", variants: ["400", "700"] },
  { family: "Lora", category: "serif", variants: ["400", "500", "600", "700"] },
  { family: "PT Serif", category: "serif", variants: ["400", "700"] },
  {
    family: "Crimson Text",
    category: "serif",
    variants: ["400", "600", "700"],
  },
  { family: "Libre Baskerville", category: "serif", variants: ["400", "700"] },
  {
    family: "Source Serif 4",
    category: "serif",
    variants: ["400", "600", "700"],
  },
  {
    family: "EB Garamond",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Cormorant Garamond",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Bitter",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Domine",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Spectral",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Cardo", category: "serif", variants: ["400", "700"] },
  {
    family: "Rokkitt",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Zilla Slab",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Vollkorn",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Arvo", category: "serif", variants: ["400", "700"] },
  { family: "Noto Serif", category: "serif", variants: ["400", "700"] },
  {
    family: "Josefin Slab",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Cormorant",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Libre Caslon Text", category: "serif", variants: ["400", "700"] },
  {
    family: "IBM Plex Serif",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  { family: "DM Serif Display", category: "serif", variants: ["400"] },
  {
    family: "Fraunces",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Newsreader",
    category: "serif",
    variants: ["400", "500", "600", "700"],
  },

  // Display (decorative, good for headers)
  { family: "Bebas Neue", category: "display", variants: ["400"] },
  { family: "Anton", category: "display", variants: ["400"] },
  { family: "Abril Fatface", category: "display", variants: ["400"] },
  { family: "Righteous", category: "display", variants: ["400"] },
  { family: "Lilita One", category: "display", variants: ["400"] },
  { family: "Staatliches", category: "display", variants: ["400"] },
  { family: "Alfa Slab One", category: "display", variants: ["400"] },
  { family: "Russo One", category: "display", variants: ["400"] },
  { family: "Bungee", category: "display", variants: ["400"] },
  { family: "Bowlby One SC", category: "display", variants: ["400"] },
  { family: "Black Ops One", category: "display", variants: ["400"] },
  { family: "Bangers", category: "display", variants: ["400"] },
  { family: "Fugaz One", category: "display", variants: ["400"] },
  { family: "Passion One", category: "display", variants: ["400", "700"] },
  { family: "Permanent Marker", category: "display", variants: ["400"] },
  {
    family: "Fredoka",
    category: "display",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Lobster", category: "display", variants: ["400"] },
  { family: "Pacifico", category: "display", variants: ["400"] },
  { family: "Creepster", category: "display", variants: ["400"] },
  { family: "Press Start 2P", category: "display", variants: ["400"] },
  { family: "VT323", category: "display", variants: ["400"] },
  {
    family: "Orbitron",
    category: "display",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Audiowide", category: "display", variants: ["400"] },
  { family: "Electrolize", category: "display", variants: ["400"] },
  { family: "Play", category: "display", variants: ["400", "700"] },
  {
    family: "Teko",
    category: "display",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Big Shoulders Display",
    category: "display",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Luckiest Guy", category: "display", variants: ["400"] },
  { family: "Rubik Mono One", category: "display", variants: ["400"] },
  { family: "Rubik Vinyl", category: "display", variants: ["400"] },
  { family: "Rubik Glitch", category: "display", variants: ["400"] },

  // Handwriting
  {
    family: "Dancing Script",
    category: "handwriting",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Caveat",
    category: "handwriting",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Satisfy", category: "handwriting", variants: ["400"] },
  { family: "Great Vibes", category: "handwriting", variants: ["400"] },
  { family: "Sacramento", category: "handwriting", variants: ["400"] },
  { family: "Tangerine", category: "handwriting", variants: ["400", "700"] },
  { family: "Indie Flower", category: "handwriting", variants: ["400"] },
  { family: "Shadows Into Light", category: "handwriting", variants: ["400"] },
  { family: "Kalam", category: "handwriting", variants: ["400", "700"] },
  { family: "Amatic SC", category: "handwriting", variants: ["400", "700"] },
  { family: "Architects Daughter", category: "handwriting", variants: ["400"] },
  { family: "Patrick Hand", category: "handwriting", variants: ["400"] },
  { family: "Courgette", category: "handwriting", variants: ["400"] },
  { family: "Cookie", category: "handwriting", variants: ["400"] },
  { family: "Yellowtail", category: "handwriting", variants: ["400"] },
  { family: "Allura", category: "handwriting", variants: ["400"] },
  { family: "Alex Brush", category: "handwriting", variants: ["400"] },
  { family: "Homemade Apple", category: "handwriting", variants: ["400"] },
  {
    family: "Covered By Your Grace",
    category: "handwriting",
    variants: ["400"],
  },
  { family: "Rock Salt", category: "handwriting", variants: ["400"] },

  // Monospace
  {
    family: "Fira Code",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "JetBrains Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Source Code Pro",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Roboto Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Space Mono", category: "monospace", variants: ["400", "700"] },
  {
    family: "IBM Plex Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Ubuntu Mono", category: "monospace", variants: ["400", "700"] },
  {
    family: "Inconsolata",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  { family: "Cousine", category: "monospace", variants: ["400", "700"] },
  { family: "Anonymous Pro", category: "monospace", variants: ["400", "700"] },
  {
    family: "Overpass Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  {
    family: "Red Hat Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
  { family: "DM Mono", category: "monospace", variants: ["400", "500"] },
  {
    family: "Azeret Mono",
    category: "monospace",
    variants: ["400", "500", "600", "700"],
  },
];

// Group fonts by category for easier filtering
export const FONT_CATEGORIES = [
  { value: "all", label: "All Fonts" },
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "display", label: "Display" },
  { value: "handwriting", label: "Handwriting" },
  { value: "monospace", label: "Monospace" },
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number]["value"];

// Get fonts filtered by category
export function getFontsByCategory(category: FontCategory): GoogleFont[] {
  if (category === "all") {
    return GOOGLE_FONTS;
  }
  return GOOGLE_FONTS.filter((font) => font.category === category);
}

// Generate Google Fonts URL for loading a font
export function getGoogleFontUrl(
  family: string,
  variants: string[] = ["400", "700"]
): string {
  const encodedFamily = encodeURIComponent(family);
  const weights = variants.join(";");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights}&display=swap`;
}
