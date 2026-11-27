/** A player search's filters, as saved with the game. Prices are in the display currency at the time. */
export interface SearchFilters { pos: string; minAge: number; maxAge: number; maxPrice: number; minStars: number; league: string; nation: string; expiring: boolean; freeOnly: boolean; scouted: boolean; name: string; sort: 'value' | 'price' | 'age' | 'stars' | 'contract' | 'name' }
