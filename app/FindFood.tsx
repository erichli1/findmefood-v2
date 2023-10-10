import { useEffect, useState } from "react"
import { getLongAndLat } from "./utils"
import axios from "axios"
import {
    Alert,
    Autocomplete,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    LinearProgress,
    TextField,
    Typography,
} from "@mui/material"
import { usePlacesWidget } from "react-google-autocomplete"
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked"

type Result = {
    distance: number
    name: string
    open_now: boolean
    price_level: number
    reviews: number
    stars: number
    place_id: string
}

type LocationOpt = "device" | "input" | undefined

function FindFood() {
    const [locationOpt, setLocationOpt] = useState<LocationOpt>()
    const [sortBy, setSortBy] = useState<string | undefined>()
    const [location, setLocation] = useState<
        | {
              latitude: number
              longitude: number
          }
        | "loading"
        | undefined
    >(undefined)
    const [locationDetails, setLocationDetails] = useState<
        { city: string; region: string; postal: string } | undefined
    >()
    const [locError, setLocError] = useState(false)
    const [currRating, setCurrRating] = useState<string>("4.0")
    const [numRating, setNumRating] = useState<string>("1000")
    const [mileRange, setMileRange] = useState<number>(1.5)
    const [resLoading, toggleResLoading] = useState(false)
    const [results, setResults] = useState<Array<Result> | undefined>()
    const [formError, setFormError] = useState<"currRating" | "numRating" | "mileRange" | "location" | undefined>(
        undefined,
    )

    console.log(results)

    const [autocompleteLocationName, setAutocompleteLocationName] = useState<string>("")

    const { ref, autocompleteRef } = usePlacesWidget({
        apiKey: process.env.NEXT_PUBLIC_GMAPS_API_KEY,
        onPlaceSelected: (place) => {
            setAutocompleteLocationName(place.formatted_address)
            const [latitude, longitude] = [place.geometry.location.lat(), place.geometry.location.lng()]
            setLocation({ latitude, longitude })
        },
        options: { types: [] },
    })

    const openMaps = async (placeId: string) => {
        const res = await axios.get(`https://52da-65-112-8-52.ngrok.io/geturl?place_id=${placeId}`)
        console.log(res)
        window.open(res.data.url, "_blank")
    }

    const getFormalLocation = async () => {
        /*
        Payload
        {
        "ip": "
        "city": "San Francisco",
        "region": "California",
        "region_code": "CA",
        "country": "US",
        "country_name": "United States",
        "continent_code": "NA",
        "in_eu": false,
        "postal": "94107",
        */
        const locationDetails = await axios.get("https://ipapi.co/json/")
        return {
            city: locationDetails.data.city,
            region: locationDetails.data.region,
            postal: locationDetails.data.postal,
        }
    }

    const search = async () => {
        if (mileRange <= 0) {
            setFormError("mileRange")
            return
        } else if (parseFloat(currRating) <= 0 || parseFloat(currRating) > 5) {
            setFormError("currRating")
            return
        } else if (parseFloat(numRating) <= 0) {
            setFormError("numRating")
            return
        } else if (!location || location === "loading") {
            setFormError("location")
            return
        } else {
            setFormError(undefined)
        }

        toggleResLoading(true)

        const res = await axios.get(
            `/api/findfood?location=${location.latitude},${location.longitude}&distance=${
                mileRange || 1.5
            }&stars=${currRating}&reviews=${numRating}`,
        )

        setResults(res.data)
        toggleResLoading(false)
    }

    useEffect(() => {
        const getLocation = async () => {
            if (locationOpt === "device") {
                setLocation("loading")
                try {
                    const pos = await getLongAndLat()
                    const formalLocation = await getFormalLocation()
                    if ("coords" in pos) {
                        setLocError(false)
                        setLocation({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        })
                        setLocationDetails(formalLocation)
                    } else {
                        setLocError(true)
                        setLocation("loading")
                    }
                } catch (err) {
                    console.log(err)
                    setLocError(true)
                    setLocation("loading")
                }
            }
        }
        getLocation()
    }, [locationOpt])

    useEffect(() => {
        if (sortBy) {
            const parts = sortBy.split("-")
            if (parts.length === 2) {
                const sortKey = parts[0] as "distance" | "price_level" | "reviews" | "stars"
                const sortDir = parts[1] as "inc" | "desc"
                setResults((prev) =>
                    [...(prev || [])].sort((a, b) =>
                        (sortDir === "inc" ? a[sortKey] >= b[sortKey] : a[sortKey] <= b[sortKey]) ? 1 : -1,
                    ),
                )
            }
        }
    }, [sortBy])

    return (
        <Grid container gap={2} direction="column">
            <Typography variant="h2">🍽 Plates</Typography>
            <Typography variant="caption">Made with ❤️ by Ivan Zhang, Derek Zheng, and Eric Li</Typography>

            <Divider />

            <Typography variant="h5">Where are you?</Typography>
            {formError === "location" && <Alert severity="error">Select a location</Alert>}
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={locationOpt === "device"}
                            onChange={(event) => {
                                if (event.target.checked) {
                                    setLocationOpt("device")
                                } else {
                                    setLocationOpt(undefined)
                                }
                            }}
                            icon={<RadioButtonUncheckedIcon />}
                            checkedIcon={<RadioButtonCheckedIcon />}
                        />
                    }
                    label="Use my location"
                />
                {locationOpt === "device" && (
                    <>
                        {location &&
                            (location === "loading" ? (
                                <LinearProgress />
                            ) : (
                                locationDetails && (
                                    <Alert severity="info">
                                        {locationDetails.city}, {locationDetails.region}, {locationDetails.postal}.
                                        Latitude: {location.latitude.toFixed(2)}, Longitude:{" "}
                                        {location.longitude.toFixed(2)}
                                    </Alert>
                                )
                            ))}
                        {locError && (
                            <Alert severity="error">
                                Location not loading? Make sure location services are enabled for your browser.
                            </Alert>
                        )}
                    </>
                )}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={locationOpt === "input"}
                            onChange={(event) => {
                                if (event.target.checked) {
                                    setLocationOpt("input")
                                } else {
                                    setLocationOpt(undefined)
                                }
                            }}
                            icon={<RadioButtonUncheckedIcon />}
                            checkedIcon={<RadioButtonCheckedIcon />}
                        />
                    }
                    label="Search"
                />
            </FormGroup>

            <Autocomplete
                freeSolo
                disableClearable
                options={[]}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField {...params} inputRef={ref} label="Search for places" variant="outlined" />
                )}
                inputValue={autocompleteLocationName}
                onInputChange={(event) => setAutocompleteLocationName((event.target as HTMLTextAreaElement).value)}
                sx={{
                    display: locationOpt === "input" ? "block" : "none",
                }}
            />

            <Divider />

            <Typography variant="h5">What ratings?</Typography>
            <Typography variant="body1">
                We&apos;ve found that top restaurants are usually &gt; 4.0 stars with &gt;1,000 reviews
            </Typography>
            <Grid container>
                <Grid item xs={6}>
                    <TextField
                        label="Min. stars"
                        type="number"
                        onChange={(e) => setCurrRating(e.target.value)}
                        value={currRating}
                        error={formError === "currRating"}
                        helperText={formError === "currRating" ? "Enter a number between 1 to 5" : ""}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="# reviews"
                        type="number"
                        onChange={(e) => setNumRating(e.target.value)}
                        value={numRating}
                        error={formError === "numRating"}
                        helperText={formError === "numRating" ? "Enter a positive number" : ""}
                    />
                </Grid>
            </Grid>
            <Typography variant="h5">What else?</Typography>
            <Grid container direction="row">
                <TextField
                    label="Max miles away"
                    placeholder="1.5"
                    type="number"
                    onChange={(e) => setMileRange(parseFloat(e.target.value))}
                    value={mileRange}
                    error={formError === "mileRange"}
                    helperText={formError === "mileRange" ? "Enter a positive number" : ""}
                />
            </Grid>
            <Button onClick={() => search()} variant="contained" color="primary">
                {results && results.length > 0 ? "Search again" : "Find me food!"}
            </Button>

            <Divider />

            {/* {(results || resLoading) && (
                        <div>
                            <div />
                            <div>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option disabled selected>
                                        Sort results by
                                    </option>
                                    <option value="distance-inc">Distance (Close to Far)</option>
                                    <option value="distance-desc">Distance (Far to Close)</option>
                                    <option value="price_level-inc">Cost (Cheap - Expensive)</option>
                                    <option value="price_level-desc">Cost (Expensive to Cheap)</option>
                                    <option value="reviews-inc">Reviews (Few to Many)</option>
                                    <option value="reviews-desc">Reviews (Many - Few)</option>
                                    <option value="stars-inc">Reviews (Worst to Best)</option>
                                    <option value="stars-desc">Reviews (Best - Worst)</option>
                                </select>
                            </div>
                        </div>
                    )} */}

            {results && results.length > 0 ? (
                results.map(({ name, price_level, distance, reviews, stars, open_now, place_id }) => (
                    <Card key={name}>
                        <CardContent>
                            <Typography variant="h6">{name}</Typography>
                            <Button onClick={() => openMaps(place_id)} variant="outlined">
                                Open in Maps
                            </Button>
                            <Typography variant="body1">
                                {stars} stars with {reviews} reviews
                            </Typography>
                            <Typography variant="body1">
                                {Array(price_level).fill("$").join("")} · {distance.toFixed(2)} miles ·{" "}
                                {open_now ? <span>Open</span> : <span>Closed</span>}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : results && results.length === 0 ? (
                <Typography variant="body1">No results found</Typography>
            ) : (
                resLoading && (
                    <>
                        <Typography variant="body1">Loading food 🤤</Typography>
                        <CircularProgress />
                    </>
                )
            )}
        </Grid>
    )
}

export default FindFood
