/**
 * Auto Product Image Resolver & High-Resolution Vector SVG Generator
 * Generates self-contained, 100% reliable SVG product illustrations.
 * Zero external network requests, zero broken image links!
 */

function encodeSVG(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim().replace(/\s+/g, " "))}`;
}

// 1. FAN
const SVG_FAN = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="fanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <!-- Outer Ring -->
  <circle cx="60" cy="60" r="50" fill="none" stroke="#DBEAFE" stroke-width="4"/>
  <!-- Fan Blades -->
  <path d="M60 42 C45 10, 75 10, 60 42 Z" fill="url(#bladeGrad)"/>
  <path d="M60 78 C45 110, 75 110, 60 78 Z" fill="url(#bladeGrad)"/>
  <path d="M42 60 C10 45, 10 75, 42 60 Z" fill="url(#bladeGrad)"/>
  <path d="M78 60 C110 45, 110 75, 78 60 Z" fill="url(#bladeGrad)"/>
  <!-- Center Cap -->
  <circle cx="60" cy="60" r="16" fill="url(#fanGrad)"/>
  <circle cx="60" cy="60" r="6" fill="#FFFFFF"/>
</svg>
`);

// 2. WASHING MACHINE
const SVG_WASHING_MACHINE = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="wmBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="wmDoor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
  </defs>
  <rect x="25" y="15" width="70" height="90" rx="10" fill="url(#wmBody)" stroke="#CBD5E1" stroke-width="3"/>
  <!-- Control Panel -->
  <rect x="33" y="23" width="30" height="10" rx="3" fill="#0F172A"/>
  <circle cx="75" cy="28" r="4" fill="#38BDF8"/>
  <circle cx="85" cy="28" r="3" fill="#94A3B8"/>
  <!-- Door -->
  <circle cx="60" cy="65" r="24" fill="#64748B"/>
  <circle cx="60" cy="65" r="19" fill="url(#wmDoor)"/>
  <path d="M48 65 Q60 55, 72 65" stroke="#7DD3FC" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>
`);

// 3. REFRIGERATOR
const SVG_FRIDGE = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="fridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <!-- Main Fridge Body -->
  <rect x="30" y="10" width="60" height="100" rx="8" fill="url(#fridgeGrad)"/>
  <!-- Door Divider Line -->
  <line x1="30" y1="48" x2="90" y2="48" stroke="#0284C7" stroke-width="2"/>
  <!-- Handles -->
  <rect x="36" y="24" width="4" height="18" rx="2" fill="#FFFFFF"/>
  <rect x="36" y="56" width="4" height="28" rx="2" fill="#FFFFFF"/>
  <!-- Water Dispenser -->
  <rect x="62" y="24" width="16" height="16" rx="3" fill="#0369A1"/>
  <circle cx="70" cy="32" r="3" fill="#38BDF8"/>
</svg>
`);

// 4. TV / TELEVISION
const SVG_TV = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="tvScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#312E81"/>
    </linearGradient>
  </defs>
  <!-- Stand -->
  <rect x="45" y="85" width="30" height="6" rx="2" fill="#64748B"/>
  <path d="M55 75 L52 85 H68 L65 75 Z" fill="#475569"/>
  <!-- Frame -->
  <rect x="12" y="20" width="96" height="58" rx="6" fill="#0F172A"/>
  <!-- Screen -->
  <rect x="16" y="24" width="88" height="50" rx="3" fill="url(#tvScreen)"/>
  <!-- Screen Reflection/Glow -->
  <polygon points="16,24 55,24 35,74 16,74" fill="#6366F1" opacity="0.3"/>
</svg>
`);

// 5. AIR CONDITIONER / AC
const SVG_AC = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="acGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>
  <!-- AC Unit -->
  <rect x="15" y="30" width="90" height="40" rx="8" fill="url(#acGrad)" stroke="#CBD5E1" stroke-width="3"/>
  <!-- Vent Line -->
  <rect x="22" y="58" width="76" height="4" rx="2" fill="#94A3B8"/>
  <!-- Display & Brand -->
  <circle cx="84" cy="42" r="4" fill="#10B981"/>
  <rect x="25" y="40" width="20" height="5" rx="2" fill="#CBD5E1"/>
  <!-- Cool Air Breeze Lines -->
  <path d="M30 80 Q45 90, 30 100" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 80 Q75 90, 60 100" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M90 80 Q105 90, 90 100" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>
`);

// 6. MICROWAVE / OVEN
const SVG_MICROWAVE = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect x="18" y="30" width="84" height="60" rx="8" fill="#334155" stroke="#1E293B" stroke-width="3"/>
  <!-- Door Glass -->
  <rect x="25" y="38" width="48" height="44" rx="4" fill="#0F172A"/>
  <rect x="28" y="41" width="42" height="38" rx="2" fill="#F59E0B" opacity="0.2"/>
  <!-- Control Panel -->
  <rect x="79" y="38" width="16" height="44" rx="3" fill="#1E293B"/>
  <rect x="82" y="42" width="10" height="8" rx="2" fill="#10B981"/>
  <circle cx="87" cy="58" r="3" fill="#94A3B8"/>
  <circle cx="87" cy="68" r="3" fill="#94A3B8"/>
</svg>
`);

// 7. LAPTOP
const SVG_LAPTOP = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <!-- Screen Frame -->
  <rect x="24" y="22" width="72" height="48" rx="5" fill="#1E293B"/>
  <!-- Display -->
  <rect x="28" y="26" width="64" height="40" rx="2" fill="url(#laptopScreen)"/>
  <!-- Base / Keyboard -->
  <path d="M12 72 L20 72 L100 72 L108 72 C110 72, 110 78, 106 78 H14 C10 78, 10 72, 12 72 Z" fill="#64748B"/>
  <!-- Trackpad -->
  <rect x="52" y="73" width="16" height="4" rx="1" fill="#94A3B8"/>
</svg>
`);

// 8. MOBILE / SMARTPHONE
const SVG_MOBILE = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
  </defs>
  <!-- Phone Body -->
  <rect x="36" y="15" width="48" height="90" rx="12" fill="#0F172A" stroke="#334155" stroke-width="3"/>
  <!-- Screen -->
  <rect x="39" y="18" width="42" height="84" rx="9" fill="url(#phoneScreen)"/>
  <!-- Camera Notch -->
  <rect x="53" y="21" width="14" height="4" rx="2" fill="#0F172A"/>
</svg>
`);

// 9. HEADPHONES
const SVG_HEADPHONES = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- Headband -->
  <path d="M30 65 C30 25, 90 25, 90 65" fill="none" stroke="#EC4899" stroke-width="8" stroke-linecap="round"/>
  <!-- Ear Cups -->
  <rect x="20" y="55" width="16" height="30" rx="8" fill="#BE185D"/>
  <rect x="84" y="55" width="16" height="30" rx="8" fill="#BE185D"/>
  <!-- Inner Cushions -->
  <rect x="32" y="60" width="6" height="20" rx="3" fill="#FCE7F3"/>
  <rect x="82" y="60" width="6" height="20" rx="3" fill="#FCE7F3"/>
</svg>
`);

// 10. SPEAKER
const SVG_SPEAKER = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect x="35" y="15" width="50" height="90" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="3"/>
  <circle cx="60" cy="40" r="12" fill="#475569"/>
  <circle cx="60" cy="40" r="5" fill="#94A3B8"/>
  <circle cx="60" cy="75" r="18" fill="#475569"/>
  <circle cx="60" cy="75" r="8" fill="#F59E0B"/>
</svg>
`);

// 11. SMARTWATCH
const SVG_SMARTWATCH = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- Strap -->
  <rect x="48" y="10" width="24" height="100" rx="4" fill="#334155"/>
  <!-- Dial Frame -->
  <rect x="34" y="34" width="52" height="52" rx="14" fill="#0F172A" stroke="#475569" stroke-width="3"/>
  <!-- Display -->
  <rect x="38" y="38" width="44" height="44" rx="10" fill="#10B981"/>
  <text x="60" y="65" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">10:45</text>
</svg>
`);

// 12. MIXER / BLENDER
const SVG_MIXER = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- Base -->
  <path d="M35 70 L40 100 H80 L85 70 Z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="2"/>
  <circle cx="60" cy="85" r="6" fill="#EF4444"/>
  <!-- Jar -->
  <path d="M42 20 L38 65 H82 L78 20 Z" fill="#94A3B8" opacity="0.8"/>
  <!-- Handle -->
  <path d="M79 28 C90 28, 90 55, 80 58" fill="none" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
</svg>
`);

// 13. SOFA / FURNITURE
const SVG_SOFA = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="sofaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <!-- Backrest -->
  <rect x="20" y="35" width="80" height="35" rx="8" fill="url(#sofaGrad)"/>
  <!-- Cushions -->
  <rect x="22" y="60" width="37" height="20" rx="5" fill="#34D399"/>
  <rect x="61" y="60" width="37" height="20" rx="5" fill="#34D399"/>
  <!-- Armrests -->
  <rect x="12" y="48" width="14" height="34" rx="6" fill="#047857"/>
  <rect x="94" y="48" width="14" height="34" rx="6" fill="#047857"/>
  <!-- Legs -->
  <rect x="22" y="80" width="6" height="12" rx="2" fill="#78350F"/>
  <rect x="92" y="80" width="6" height="12" rx="2" fill="#78350F"/>
</svg>
`);

// 14. DEFAULT PRODUCT BOX
const SVG_DEFAULT_BOX = encodeSVG(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#EAB308"/>
    </linearGradient>
    <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CA8A04"/>
      <stop offset="100%" stop-color="#A16207"/>
    </linearGradient>
    <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#CA8A04"/>
    </linearGradient>
  </defs>
  <!-- 3D Box Top -->
  <polygon points="60,25 95,42 60,60 25,42" fill="url(#boxTop)"/>
  <!-- 3D Box Left -->
  <polygon points="25,42 60,60 60,95 25,77" fill="url(#boxLeft)"/>
  <!-- 3D Box Right -->
  <polygon points="60,60 95,42 95,77 60,95" fill="url(#boxRight)"/>
  <!-- Tape -->
  <polygon points="48,32 72,44 60,50 36,38" fill="#A16207" opacity="0.6"/>
</svg>
`);

const PRODUCT_IMAGE_MAP: Array<{ keywords: string[]; svg: string }> = [
  { keywords: ["fan", "ceiling fan", "table fan", "pedestal fan", "exhaust fan", "pankha"], svg: SVG_FAN },
  { keywords: ["washing machine", "washer", "dryer", "laundry", "top load", "front load"], svg: SVG_WASHING_MACHINE },
  { keywords: ["refrigerator", "fridge", "freezer", "double door", "single door", "deep freezer"], svg: SVG_FRIDGE },
  { keywords: ["tv", "television", "led tv", "smart tv", "oled", "qled", "screen", "display"], svg: SVG_TV },
  { keywords: ["air conditioner", "ac", "split ac", "window ac", "inverter ac", "cooler", "air cooler"], svg: SVG_AC },
  { keywords: ["microwave", "oven", "otg", "convection", "baking oven"], svg: SVG_MICROWAVE },
  { keywords: ["laptop", "computer", "pc", "macbook", "notebook", "desktop"], svg: SVG_LAPTOP },
  { keywords: ["mobile", "phone", "smartphone", "iphone", "galaxy", "android", "cellphone"], svg: SVG_MOBILE },
  { keywords: ["headset", "headphone", "earphone", "earbuds", "airpods"], svg: SVG_HEADPHONES },
  { keywords: ["speaker", "soundbar", "home theater", "audio", "bluetooth speaker", "woofer"], svg: SVG_SPEAKER },
  { keywords: ["smart watch", "watch", "smartwatch", "fitness band"], svg: SVG_SMARTWATCH },
  { keywords: ["mixer", "blender", "grinder", "juicer", "food processor", "mixer grinder"], svg: SVG_MIXER },
  { keywords: ["sofa", "couch", "recliner", "settee", "furniture", "chair", "bed"], svg: SVG_SOFA }
];

/**
 * Returns a self-contained SVG product illustration that NEVER breaks or fails to load.
 */
export function getAutoProductImage(
  name?: string,
  brand?: string,
  category?: string,
  customImage?: string
): string {
  // If custom user-uploaded image exists and is valid (not default box emoji), use it
  if (customImage && typeof customImage === "string" && customImage.trim() !== "" && customImage !== "📦") {
    return customImage;
  }

  const queryText = `${name || ""} ${brand || ""} ${category || ""}`.toLowerCase();

  for (const item of PRODUCT_IMAGE_MAP) {
    if (item.keywords.some((kw) => queryText.includes(kw))) {
      return item.svg;
    }
  }

  return SVG_DEFAULT_BOX;
}
