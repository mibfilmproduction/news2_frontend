import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Minus, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "./LanguageSwitcher";
import { STATES, STATE_CITIES, citiesForState, findStateForCity } from "@/lib/cities";
import { cn } from "@/lib/utils";

export const SELECTED_CITY_KEY = "selected-city";
export const SELECTED_STATE_KEY = "selected-state";

export const getSelectedCity = (): string => {
  try {
    return localStorage.getItem(SELECTED_CITY_KEY) || "";
  } catch {
    return "";
  }
};

/**
 * "Choose City / शहर चुनें" trigger + right-side slider.
 * Lists all states; the + button on a state expands its cities.
 * Clicking a city opens that city's articles directly.
 */
const CitySelector: React.FC<{ className?: string; onOpenChange?: (open: boolean) => void }> = ({ className = "", onOpenChange }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const hindi = language === "hindi";
  const [open, setOpen] = useState(false);
  // Notify parent (e.g. mobile sidebar) so it can close itself — the city
  // sheet renders below the sidebar overlay, so both must not stay open.
  const handleSheetOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(getSelectedCity);

  const q = query.trim().toLowerCase();
  const filteredStates = useMemo(() => {
    if (!q) return STATES;
    // Match state names AND city names (a matching city surfaces its state).
    return STATES.filter(
      (s) =>
        s.toLowerCase().includes(q) ||
        (STATE_CITIES[s] || []).some((c) => c.toLowerCase().includes(q))
    );
  }, [q]);

  const toggleState = (state: string) => {
    setExpanded((prev) => (prev === state ? null : state));
  };

  const goState = (state: string) => {
    try {
      localStorage.setItem(SELECTED_STATE_KEY, state);
      localStorage.removeItem(SELECTED_CITY_KEY);
    } catch { /* ignore */ }
    setSelectedCity("");
    setOpen(false);
    navigate(`/state/${encodeURIComponent(state)}`);
  };

  const goCity = (city: string) => {
    const state = findStateForCity(city) || expanded || "";
    try {
      localStorage.setItem(SELECTED_CITY_KEY, city);
      if (state) localStorage.setItem(SELECTED_STATE_KEY, state);
    } catch { /* ignore */ }
    setSelectedCity(city);
    setOpen(false);
    navigate(`/city/${encodeURIComponent(city)}`);
  };

  const clearSelection = () => {
    try {
      localStorage.removeItem(SELECTED_CITY_KEY);
      localStorage.removeItem(SELECTED_STATE_KEY);
    } catch { /* ignore */ }
    setSelectedCity("");
    setOpen(false);
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-primary hover:text-primary",
            className
          )}
          aria-label={hindi ? "शहर चुनें" : "Choose city"}
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="max-w-[140px] truncate">
            {selectedCity || (hindi ? "शहर चुनें" : "Choose City")}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[320px] flex-col p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-gray-200 p-4 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              {hindi ? "अपना शहर चुनें" : "Choose your city"}
            </SheetTitle>
            {selectedCity && (
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
                {hindi ? "हटाएं" : "Clear"}
              </button>
            )}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={hindi ? "राज्य या शहर खोजें..." : "Search state or city..."}
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredStates.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">
              {hindi ? "कोई राज्य या शहर नहीं मिला" : "No state or city found"}
            </p>
          )}
          {filteredStates.map((state) => {
            const isOpen = expanded === state || (!!q && q.length > 0 && filteredStates.length < 6);
            const cities = citiesForState(state).filter(
              (c) => !q || c.toLowerCase().includes(q) || state.toLowerCase().includes(q)
            );
            return (
              <div key={state} className="mb-1 overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => goState(state)}
                    className="flex-1 px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-primary"
                  >
                    {state}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({(STATE_CITIES[state] || []).length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleState(state)}
                    aria-label={isOpen ? `Collapse ${state}` : `Expand ${state}`}
                    className="m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-primary hover:text-white"
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-2 py-2">
                    {cities.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-gray-500">
                        {hindi ? "इस राज्य में शहर नहीं मिले" : "No cities found in this state"}
                      </p>
                    ) : (
                      <div className="flex flex-col">
                        {cities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => goCity(city)}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white hover:text-primary",
                              selectedCity === city
                                ? "font-semibold text-primary"
                                : "text-gray-700"
                            )}
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CitySelector;
