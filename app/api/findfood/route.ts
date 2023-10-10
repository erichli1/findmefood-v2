import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { processAllAPIResults } from "./_process"
import axios, { AxiosResponse } from "axios"
import url from "url"

// Contains all of the user's filter preferences
interface ResultFilterParams {
    minRating: number
    minNumReviews: number
    currentLat: string
    currentLong: string
    maxPriceLevel?: number
}

export async function GET(request: NextRequest) {
    return NextResponse.json(
        [
            {
                distance: 0.16841699773090313,
                name: "Russell House Tavern",
                open_now: true,
                place_id: "ChIJ2w69uEJ344kRKVe3Zf0YBK8",
                price_level: 2,
                reviews: 2520,
                stars: 4.3,
            },
        ],
        {
            status: 200,
        },
    )

    return await getNearbyRestaurants(request)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const getNearbyRestaurants = async (req: NextRequest) => {
    let frontendParams = url.parse(req.url, true).query

    const radius = convertStringMilesToMeters(frontendParams.distance as string)
    const latLongArray = (frontendParams.location as string).split(",")

    const params = {
        params: {
            key: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
            location: frontendParams.location,
            radius: radius,
            type: "restaurant",
            opennow: true,
        },
    }

    const resultFilters: ResultFilterParams = {
        minRating: parseFloat(frontendParams.stars as string),
        minNumReviews: parseFloat(frontendParams.reviews as string),
        currentLat: latLongArray[0],
        currentLong: latLongArray[1],
    }

    let result: AxiosResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, params)

    let localNextPageToken = result.data.next_page_token
    let counter = 0

    let restaurants = result.data.results

    // Get top 60 results from Google Maps through paging
    while (localNextPageToken != null && counter < 2) {
        const tempParams = {
            params: {
                key: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
                pagetoken: localNextPageToken,
            },
        }

        // Token needs some time to become usable
        await sleep(2000)

        let temp: AxiosResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
            tempParams,
        )
        console.log("page " + (counter + 2) + " has " + temp.data.results.length + " results")

        restaurants = [...restaurants, ...temp.data.results]
        counter++

        localNextPageToken = temp.data.next_page_token
    }

    return NextResponse.json(processAllAPIResults(restaurants, resultFilters), { status: 200 })
}

function convertStringMilesToMeters(distanceInMiles: string) {
    return parseFloat(distanceInMiles) * 1609.34
}
