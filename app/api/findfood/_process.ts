// import { ResultFilterParams, PriceOptions, FindMeFoodResult } from "./types"

interface FindMeFoodResult {
    name: string
    stars: number
    reviews: number
    distance: number
    price_level: number
    place_id: string
    open_now?: boolean
}

// Contains all of the user's filter preferences
interface ResultFilterParams {
    minRating: number
    minNumReviews: number
    currentLat: string
    currentLong: string
    maxPriceLevel?: number
}

// Used to type price options, considering Google API
enum PriceOptions {
    FREE = 0,
    ONE_DOLLAR_SIGN = 1,
    TWO_DOLLAR_SIGNS = 2,
    THREE_DOLLAR_SIGNS = 3,
    FOUR_DOLLAR_SIGNS = 4,
}

const PLACES_API_OPERATIONAL_STRING = "OPERATIONAL"

export function processAllAPIResults(results: any[], params: ResultFilterParams): any[] {
    const filteredResults = filterAllResultsByPreferences(results, params)
    return postProcessAllFilteredResults(filteredResults, params)
}

function postProcessAllFilteredResults(filteredResults: any[], params: ResultFilterParams): FindMeFoodResult[] {
    // Calculate distance in miles for all places
    const filteredResultsDistances = filteredResults.map((res) => {
        return calculateDistanceInMiles(
            Number(params.currentLat),
            Number(params.currentLong),
            res.geometry.location.lat,
            res.geometry.location.lng,
        )
    })

    // TODO: Process URL to enable passthrough to user

    // Map API results to final shape for return to user
    const finalResults = filteredResults.map((item, index) => {
        const finalResult: FindMeFoodResult = {
            name: item.name,
            stars: item.rating,
            reviews: item.user_ratings_total,
            distance: filteredResultsDistances[index],
            price_level: item.price_level,
            open_now: item.opening_hours.open_now,
            place_id: item.place_id,
        }
        return finalResult
    })
    return finalResults
}

/**
 *
 * @param results Array of API results from Places API with all restaurant listings
 * @param params interface with all filter params from user
 * @returns fully filtered list of results
 */
function filterAllResultsByPreferences(results: any[], params: ResultFilterParams): any[] {
    return results.filter((result) => {
        return (
            filterByOpen(result) &&
            filterRatingsQuality(result, params.minRating, params.minNumReviews) &&
            (params.maxPriceLevel !== undefined ? filterByPrice(result, params.maxPriceLevel) : true)
        )
    })
}

/**
 * Filter util function to calculate whether a result satisfies minRating and minNumReviews constratints.
 *
 * @param result — API result from Places API with all restaurants
 * @param minRating — minimum rating for all eligbile APIs
 * @returns True if a place's rating is greater than minRating
 */
const filterRatingsQuality = (result: any, minRating: number, minNumReviews: number): boolean => {
    return result.rating >= minRating && result.user_ratings_total >= minNumReviews
}

/**
 * Filter util function to calculate whether a result is within the max distance
 *
 * @param result — API result from Places API with all restaurants
 * @param maxDistance — furthest distance from current location, in miles
 * @returns True if place element is within the maxDistance
 */
const filterByDistance = (result: any, maxDistance: number, currentLat: number, currentLong: number): boolean => {
    const resultLat: number = result.geometry.location.lat
    const resultLong: number = result.geometry.location.lng
    return calculateDistanceInMiles(currentLat, currentLong, resultLat, resultLong) <= maxDistance
}

/**
 *
 * @param result API result from Places API with all restaurants
 * @returns True if restaurant is currently open and operational
 */
const filterByOpen = (result: any): boolean => {
    return result.business_status === PLACES_API_OPERATIONAL_STRING && result.opening_hours.open_now
}

/**
 *
 * @param result API result from Places API with all restaurants
 * @param highestPrice int corresponding to a price level (see PriceOptions enum)
 * @returns True if restaurant/result is within the price range
 */
const filterByPrice = (result: any, highestPrice: number): boolean => {
    const highestPriceValue = PriceOptions[highestPrice]
    return result.price_level <= highestPriceValue
}

/**
 * Util function to calculate the distance between current location and result location in miles
 * Reference: https://www.geodatasource.com/developers/javascript
 *
 * @param currentLat current location of user (latitude)
 * @param currentLong ''' (longitude)
 * @param placeLat location of result (latitude)
 * @param placeLong ''' (longitude)
 * @returns distance between both locations in miles (as the crow flies)
 */
function calculateDistanceInMiles(
    currentLat: number,
    currentLong: number,
    placeLat: number,
    placeLong: number,
): number {
    if (currentLat == placeLat && currentLong == placeLong) {
        return 0
    } else {
        var radlat1 = (Math.PI * currentLat) / 180
        var radlat2 = (Math.PI * placeLat) / 180
        var theta = currentLong - placeLong
        var radtheta = (Math.PI * theta) / 180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
        if (dist > 1) {
            dist = 1
        }
        dist = Math.acos(dist)
        dist = (dist * 180) / Math.PI
        dist = dist * 60 * 1.1515
        return dist
    }
}
