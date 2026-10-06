/**
 * Shared state → city data for article geo-tagging + state/city-wise filtering.
 * `ALL_*` ("all") means the article is visible everywhere.
 */
export const ALL_CITIES = 'all';
export const ALL_CITIES_LABEL = 'All Cities';

export const ALL_STATES = 'all';
export const ALL_STATES_LABEL = 'All India';

export const STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
];

export const STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Amaravati', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Chittoor', 'Eluru', 'Ongole', 'Kakinada'],
  'Arunachal Pradesh': ['Itanagar'],
  Assam: ['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur'],
  Delhi: ['Delhi'],
  Goa: ['Panaji', 'Margao'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Junagadh', 'Gandhinagar', 'Anand'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Karnal', 'Rohtak', 'Sonipat', 'Yamunanagar'],
  'Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Gulbarga', 'Davangere'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
  Ladakh: ['Leh', 'Kargil'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai', 'Kalyan', 'Amravati', 'Nanded'],
  Manipur: ['Imphal'],
  Meghalaya: ['Shillong'],
  Mizoram: ['Aizawl'],
  Nagaland: ['Kohima', 'Dimapur'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur'],
  Puducherry: ['Puducherry'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner', 'Alwar'],
  Sikkim: ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Tirunelveli', 'Vellore', 'Tiruppur'],
  Telangana: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
  Tripura: ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Ghaziabad', 'Noida', 'Greater Noida', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Jhansi', 'Mathura', 'Firozabad', 'Ayodhya'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  Chandigarh: ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman'],
  Lakshadweep: ['Kavaratti'],
};

/** Flat alphabetical city list (all states) — for "all states" mode. */
export const CITIES: string[] = [...new Set(Object.values(STATE_CITIES).flat())].sort();

/** Cities for a state selection ('all' → every city). */
export const citiesForState = (state: unknown): string[] => {
  const s = typeof state === 'string' ? state.trim() : '';
  if (!s || s.toLowerCase() === ALL_STATES) return CITIES;
  return STATE_CITIES[s] || [];
};

/** Find which state a city belongs to (for displaying saved articles). */
export const findStateForCity = (city: unknown): string | null => {
  const c = typeof city === 'string' ? city.trim().toLowerCase() : '';
  if (!c || c === ALL_CITIES) return null;
  for (const [state, cities] of Object.entries(STATE_CITIES)) {
    if (cities.some((x) => x.toLowerCase() === c)) return state;
  }
  return null;
};

export const normalizeCity = (value: unknown): string => {
  const v = typeof value === 'string' ? value.trim() : '';
  return v || ALL_CITIES;
};

export const normalizeState = (value: unknown): string => {
  const v = typeof value === 'string' ? value.trim() : '';
  return v || ALL_STATES;
};

export const isAllCities = (value: unknown): boolean => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return !v || v === ALL_CITIES;
};

export const isAllStates = (value: unknown): boolean => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return !v || v === ALL_STATES;
};

export const cityLabel = (value: unknown): string => {
  if (isAllCities(value)) return ALL_CITIES_LABEL;
  return typeof value === 'string' ? value : ALL_CITIES_LABEL;
};

export const stateLabel = (value: unknown): string => {
  if (isAllStates(value)) return ALL_STATES_LABEL;
  return typeof value === 'string' ? value : ALL_STATES_LABEL;
};
