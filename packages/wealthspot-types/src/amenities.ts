// ============================================================================
// WealthSpot — Master Real-Estate Amenity Registry
// Each amenity has a stable key, display label, Lucide icon name, and category.
// The icon names map directly to lucide-react and lucide-react-native exports.
// ============================================================================

export interface AmenityDefinition {
  key: string;
  label: string;
  /** Lucide icon name (PascalCase) — import { <icon> } from "lucide-react" */
  icon: string;
  category: AmenityCategory;
}

export type AmenityCategory =
  | "lifestyle"
  | "security"
  | "convenience"
  | "community"
  | "healthcare"
  | "green"
  | "retail"
  | "connectivity"
  | "villa"
  | "commercial"
  | "warehouse";

export const AMENITY_CATEGORIES: Record<AmenityCategory, string> = {
  lifestyle: "Lifestyle & Recreation",
  security: "Safety & Security",
  convenience: "Convenience & Infrastructure",
  community: "Community Spaces",
  healthcare: "Health & Wellness",
  green: "Green & Sustainability",
  retail: "Retail & Services",
  connectivity: "Connectivity & Location",
  villa: "Villa & Premium Features",
  commercial: "Commercial & Office Features",
  warehouse: "Warehouse & Logistics Features",
};

export const AMENITIES: AmenityDefinition[] = [
  // ── Lifestyle & Recreation ────────────────────────────────────────────────
  { key: "swimming_pool", label: "Swimming Pool", icon: "Waves", category: "lifestyle" },
  { key: "gymnasium", label: "Gymnasium / Fitness Centre", icon: "Dumbbell", category: "lifestyle" },
  { key: "jogging_track", label: "Jogging / Walking Track", icon: "Footprints", category: "lifestyle" },
  { key: "cycling_track", label: "Cycling Track", icon: "Bike", category: "lifestyle" },
  { key: "tennis_court", label: "Tennis Court", icon: "Target", category: "lifestyle" },
  { key: "badminton_court", label: "Badminton Court", icon: "Wind", category: "lifestyle" },
  { key: "basketball_court", label: "Basketball Court", icon: "CircleDot", category: "lifestyle" },
  { key: "squash_court", label: "Squash Court", icon: "Target", category: "lifestyle" },
  { key: "cricket_practice_net", label: "Cricket Practice Net", icon: "Crosshair", category: "lifestyle" },
  { key: "volleyball_court", label: "Volleyball Court", icon: "CircleDot", category: "lifestyle" },
  { key: "kids_play_area", label: "Children's Play Area", icon: "Star", category: "lifestyle" },
  { key: "kids_splash_pad", label: "Kids' Splash Pad", icon: "Waves", category: "lifestyle" },
  { key: "indoor_games", label: "Indoor Games Room", icon: "Gamepad2", category: "lifestyle" },
  { key: "yoga_deck", label: "Yoga / Meditation Deck", icon: "Heart", category: "lifestyle" },
  { key: "spa_wellness", label: "Spa & Wellness Centre", icon: "Sparkles", category: "lifestyle" },
  { key: "rooftop_garden", label: "Rooftop Garden / Terrace", icon: "Flower2", category: "lifestyle" },
  { key: "landscaped_gardens", label: "Landscaped Gardens", icon: "Trees", category: "lifestyle" },
  { key: "amphitheatre", label: "Amphitheatre / Open Stage", icon: "Music", category: "lifestyle" },
  { key: "mini_theatre", label: "Mini Theatre / Screening Room", icon: "Film", category: "lifestyle" },
  { key: "banquet_hall", label: "Banquet Hall", icon: "PartyPopper", category: "lifestyle" },
  { key: "party_lawn", label: "Party Lawn / Outdoor Events Space", icon: "Tent", category: "lifestyle" },
  { key: "golf_course", label: "Golf Course / Putting Green", icon: "Flag", category: "lifestyle" },
  { key: "skating_rink", label: "Skating Rink", icon: "Zap", category: "lifestyle" },
  { key: "pet_park", label: "Pet Park / Dog Run", icon: "PawPrint", category: "lifestyle" },

  // ── Safety & Security ──────────────────────────────────────────────────────
  { key: "cctv_24x7", label: "24/7 CCTV Surveillance", icon: "Camera", category: "security" },
  { key: "intercom", label: "Intercom Facility", icon: "Phone", category: "security" },
  { key: "security_guard", label: "Security Guards (24/7)", icon: "Shield", category: "security" },
  { key: "video_door_phone", label: "Video Door Phone", icon: "Monitor", category: "security" },
  { key: "gated_community", label: "Gated Community", icon: "Lock", category: "security" },
  { key: "fire_safety", label: "Fire Safety Systems & Sprinklers", icon: "Flame", category: "security" },
  { key: "smart_access", label: "Smart Access Control / RFID", icon: "KeyRound", category: "security" },
  { key: "boom_barrier", label: "Boom Barrier at Entry", icon: "TriangleAlert", category: "security" },
  { key: "panic_button", label: "Panic / Emergency Button", icon: "AlertTriangle", category: "security" },
  { key: "visitor_management", label: "Visitor Management System", icon: "UserCheck", category: "security" },

  // ── Convenience & Infrastructure ──────────────────────────────────────────
  { key: "power_backup", label: "100% Power Backup", icon: "Zap", category: "convenience" },
  { key: "high_speed_lifts", label: "High-Speed Elevators", icon: "ArrowUp", category: "convenience" },
  { key: "covered_parking", label: "Covered / Stilt Parking", icon: "Car", category: "convenience" },
  { key: "visitor_parking", label: "Visitor Parking", icon: "ParkingSquare", category: "convenience" },
  { key: "ev_charging", label: "EV Charging Points", icon: "BatteryCharging", category: "convenience" },
  { key: "solar_power", label: "Solar Power / Panels", icon: "Sun", category: "convenience" },
  { key: "rainwater_harvesting", label: "Rainwater Harvesting", icon: "Droplets", category: "convenience" },
  { key: "wifi_common_areas", label: "Wi-Fi in Common Areas", icon: "Wifi", category: "convenience" },
  { key: "concierge", label: "Concierge / Facility Desk", icon: "Bell", category: "convenience" },
  { key: "smart_parcel_locker", label: "Smart Parcel / Package Lockers", icon: "Package", category: "convenience" },
  { key: "gas_pipeline", label: "Piped Gas Connection", icon: "Flame", category: "convenience" },
  { key: "water_purification", label: "Central Water Purification", icon: "Droplets", category: "convenience" },
  { key: "valet_parking", label: "Valet Parking Service", icon: "KeyRound", category: "convenience" },
  { key: "dry_cleaning_drop", label: "Dry Cleaning Drop-off Point", icon: "Shirt", category: "convenience" },
  { key: "servant_quarters", label: "Servant / Driver Quarters", icon: "Home", category: "convenience" },

  // ── Community Spaces ───────────────────────────────────────────────────────
  { key: "club_house", label: "Club House", icon: "Building2", category: "community" },
  { key: "multipurpose_hall", label: "Multipurpose / Party Hall", icon: "Layout", category: "community" },
  { key: "co_working_space", label: "Co-working Space / Business Lounge", icon: "Monitor", category: "community" },
  { key: "library", label: "Library / Reading Room", icon: "BookOpen", category: "community" },
  { key: "conference_room", label: "Conference / Meeting Room", icon: "Users", category: "community" },
  { key: "business_centre", label: "Business Centre", icon: "Briefcase", category: "community" },
  { key: "community_garden", label: "Community Garden / Terrace Farm", icon: "Sprout", category: "community" },

  // ── Health & Wellness ──────────────────────────────────────────────────────
  { key: "medical_room", label: "Medical / First Aid Room", icon: "Cross", category: "healthcare" },
  { key: "creche_daycare", label: "Crèche / Day-care Centre", icon: "Baby", category: "healthcare" },
  { key: "senior_citizen_zone", label: "Senior Citizen Zone", icon: "HeartPulse", category: "healthcare" },
  { key: "pharmacy", label: "On-site Pharmacy", icon: "Pill", category: "healthcare" },
  { key: "doctor_on_call", label: "Doctor On-call Service", icon: "Stethoscope", category: "healthcare" },

  // ── Green & Sustainability ─────────────────────────────────────────────────
  { key: "organic_waste_converter", label: "Organic Waste Converter", icon: "Recycle", category: "green" },
  { key: "sewage_treatment", label: "Sewage Treatment Plant (STP)", icon: "Droplets", category: "green" },
  { key: "led_street_lights", label: "LED Street Lighting", icon: "Lightbulb", category: "green" },
  { key: "eco_construction", label: "Green / Eco-friendly Construction", icon: "Leaf", category: "green" },
  { key: "tree_plantation", label: "Tree Plantation / Urban Forest", icon: "Trees", category: "green" },
  { key: "bicycle_parking", label: "Bicycle Parking / Cycle Stand", icon: "Bike", category: "green" },
  { key: "green_certification", label: "IGBC / GRIHA Green Certification", icon: "Award", category: "green" },

  // ── Retail & Services ──────────────────────────────────────────────────────
  { key: "supermarket", label: "Supermarket / Provision Store", icon: "ShoppingCart", category: "retail" },
  { key: "atm", label: "ATM / Bank Branch", icon: "CreditCard", category: "retail" },
  { key: "cafeteria", label: "Cafeteria / Café", icon: "Coffee", category: "retail" },
  { key: "restaurant", label: "Restaurant / Dining", icon: "Utensils", category: "retail" },
  { key: "salon", label: "Salon / Grooming Centre", icon: "Scissors", category: "retail" },

  // ── Connectivity & Location ────────────────────────────────────────────────
  { key: "metro_nearby", label: "Metro Station Nearby", icon: "Train", category: "connectivity" },
  { key: "bus_stop_nearby", label: "Bus Stop Nearby", icon: "Bus", category: "connectivity" },
  { key: "school_nearby", label: "School / College Nearby", icon: "GraduationCap", category: "connectivity" },
  { key: "hospital_nearby", label: "Hospital / Clinic Nearby", icon: "Cross", category: "connectivity" },
  { key: "airport_proximity", label: "Airport Proximity", icon: "Plane", category: "connectivity" },
  { key: "highway_access", label: "Highway / Expressway Access", icon: "Route", category: "connectivity" },
  { key: "shopping_mall_nearby", label: "Shopping Mall Nearby", icon: "Store", category: "connectivity" },

  // ── Villa & Premium Features ───────────────────────────────────────────────
  { key: "private_pool", label: "Private Swimming Pool", icon: "Waves", category: "villa" },
  { key: "private_garden", label: "Private Garden / Landscaped Yard", icon: "Flower2", category: "villa" },
  { key: "home_automation", label: "Home Automation / Smart Home", icon: "Cpu", category: "villa" },
  { key: "solar_water_heater", label: "Solar Water Heater", icon: "Sun", category: "villa" },
  { key: "service_entrance", label: "Separate Service Entrance", icon: "DoorOpen", category: "villa" },
  { key: "modular_kitchen", label: "Modular Kitchen", icon: "Utensils", category: "villa" },
  { key: "double_height_ceiling", label: "Double-Height Ceiling", icon: "ArrowUpDown", category: "villa" },
  { key: "private_terrace", label: "Private Terrace / Deck", icon: "Wind", category: "villa" },
  { key: "wine_cellar", label: "Wine Cellar / Utility Room", icon: "Wine", category: "villa" },

  // ── Commercial & Office Features ──────────────────────────────────────────
  { key: "food_court", label: "Food Court / Eatery Zone", icon: "Utensils", category: "commercial" },
  { key: "server_room", label: "Dedicated Server / Data Room", icon: "Server", category: "commercial" },
  { key: "high_speed_internet", label: "High-Speed Fibre Internet (Leased Line)", icon: "Wifi", category: "commercial" },
  { key: "reception_lobby", label: "Premium Reception Lobby", icon: "Building", category: "commercial" },
  { key: "trading_floor", label: "Open Trading / Flexible Floor Plates", icon: "LayoutGrid", category: "commercial" },
  { key: "raised_flooring", label: "Raised Access Flooring", icon: "Layers", category: "commercial" },
  { key: "bms_system", label: "Building Management System (BMS)", icon: "Settings", category: "commercial" },
  { key: "multi_tenant_lobby", label: "Multi-tenant Access Lobby", icon: "Users", category: "commercial" },
  { key: "dedicated_power_feeder", label: "Dedicated HT Power Feeder", icon: "Zap", category: "commercial" },

  // ── Warehouse & Logistics Features ────────────────────────────────────────
  { key: "loading_docks", label: "Loading / Unloading Docks", icon: "Truck", category: "warehouse" },
  { key: "cold_storage", label: "Cold Storage / Temperature-Controlled", icon: "Thermometer", category: "warehouse" },
  { key: "high_bay_clearance", label: "High Bay Clearance (12m+)", icon: "ArrowUp", category: "warehouse" },
  { key: "dock_leveler", label: "Hydraulic Dock Leveller", icon: "Layers", category: "warehouse" },
  { key: "material_handling_area", label: "Material Handling & Staging Area", icon: "Package", category: "warehouse" },
  { key: "eod_yard", label: "End-of-Dock (EOD) Yard for Trucks", icon: "Route", category: "warehouse" },
  { key: "fire_suppression", label: "Sprinkler / Fire Suppression System", icon: "Flame", category: "warehouse" },
  { key: "solar_rooftop", label: "Solar Rooftop Power Generation", icon: "Sun", category: "warehouse" },
  { key: "logistics_office", label: "On-site Logistics / Admin Office", icon: "Briefcase", category: "warehouse" },
];

/** Look up a single amenity definition by key (O(1) via Map). */
const _amenityMap = new Map(AMENITIES.map((a) => [a.key, a]));

export function getAmenity(key: string): AmenityDefinition | undefined {
  return _amenityMap.get(key);
}

/** Return amenity definitions for an array of keys, preserving order. */
export function resolveAmenities(keys: string[]): AmenityDefinition[] {
  return keys.flatMap((k) => {
    const a = _amenityMap.get(k);
    return a ? [a] : [];
  });
}

/** Group an array of AmenityDefinitions by their category. */
export function groupAmenitiesByCategory(
  amenities: AmenityDefinition[]
): Record<AmenityCategory, AmenityDefinition[]> {
  const result: Partial<Record<AmenityCategory, AmenityDefinition[]>> = {};
  for (const a of amenities) {
    if (!result[a.category]) result[a.category] = [];
    result[a.category]!.push(a);
  }
  return result as Record<AmenityCategory, AmenityDefinition[]>;
}
