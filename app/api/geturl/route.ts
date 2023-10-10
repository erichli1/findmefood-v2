import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import axios, { AxiosResponse } from "axios"
import url from "url"

export async function GET(request: NextRequest) {
    return getPlaceDetails(request)
}

const getPlaceDetails = async (req: NextRequest) => {
    const frontendParams = url.parse(req.url, true).query

    const params = {
        params: {
            key: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
            place_id: frontendParams.place_id,
            fields: "url", // Edit this to include more fields if needed
        },
    }

    const result: AxiosResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, params)

    let details = null

    try {
        details = result.data.result

        details = {
            url: details.url,
        }
    } catch {
        return NextResponse.json({ error: "Error fetching url from Google Places API" }, { status: 500 })
    }

    return NextResponse.json(details, { status: 200 })
}
