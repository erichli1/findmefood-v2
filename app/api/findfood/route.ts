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
    // return NextResponse.json(
    //     [
    //         {
    //             distance: 0.16841699773090313,
    //             name: "Russell House Tavern",
    //             open_now: true,
    //             place_id: "ChIJ2w69uEJ344kRKVe3Zf0YBK8",
    //             price_level: 2,
    //             reviews: 2520,
    //             stars: 4.3,
    //         },
    //     ],
    //     {
    //         status: 200,
    //     },
    // )

    return await getNearbyRestaurants(request)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const getNearbyRestaurants = async (req: NextRequest) => {
    let frontendParams = url.parse(req.url, true).query

    const radius = convertStringMilesToMeters(frontendParams.distance as string)
    const latLongArray = (frontendParams.location as string).split(",")

    const sharedParams = {
        key: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
        location: frontendParams.location,
        radius: radius,
        type: "restaurant",
        opennow: true,
    }

    const resultFilters: ResultFilterParams = {
        minRating: parseFloat(frontendParams.stars as string),
        minNumReviews: parseFloat(frontendParams.reviews as string),
        currentLat: latLongArray[0],
        currentLong: latLongArray[1],
    }

    const restaurants: Array<any> = []

    const PAGINATIONS = 2

    // TODO: Can parallelize 4 different calls by using minprice, maxprice once GMaps API issues resolved
    const nextPageTokens: Array<string | undefined> = [""]

    let counter = 0

    while (counter <= PAGINATIONS) {
        const apiPromises = nextPageTokens.map((nextPageToken, index) => {
            // const priceSpecificParams = {
            //     minprice: index + 1,
            //     maxprice: index + 1,
            // }

            const params =
                nextPageToken === undefined || nextPageToken === ""
                    ? sharedParams
                    : {
                          key: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
                          pagetoken: nextPageToken,
                      }

            if (nextPageToken !== undefined) {
                return axios
                    .get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
                        params,
                    })
                    .then((result: AxiosResponse) => {
                        restaurants.push(...result.data.results)
                        // console.log(`pushed ${result.data.results.length}`)
                        nextPageTokens[index] = result.data.next_page_token
                        // console.log(`token: ${result.data.next_page_token}`)
                    })
            }
        })

        await Promise.all(apiPromises)

        counter++

        // Wait 2 seconds for next page tokens to become usable
        if (counter <= PAGINATIONS) await sleep(2000)
    }

    // console.log(restaurants.length)

    return NextResponse.json(processAllAPIResults(restaurants, resultFilters), { status: 200 })
}

function convertStringMilesToMeters(distanceInMiles: string) {
    return parseFloat(distanceInMiles) * 1609.34
}
