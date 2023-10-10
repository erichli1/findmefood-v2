// Represents one recommendation to be passed back to the user
export interface FindMeFoodResult {
    name: string
    stars: number
    reviews: number
    distance: number
    price_level: number
    place_id: string
    open_now?: boolean
}

// Contains all of the user's filter preferences
export interface ResultFilterParams {
    minRating: number
    minNumReviews: number
    currentLat: string
    currentLong: string
    maxPriceLevel?: number
}

// Used to type price options, considering Google API
export enum PriceOptions {
    FREE = 0,
    ONE_DOLLAR_SIGN = 1,
    TWO_DOLLAR_SIGNS = 2,
    THREE_DOLLAR_SIGNS = 3,
    FOUR_DOLLAR_SIGNS = 4,
}
