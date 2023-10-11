import { useEffect, useState } from "react"
import { getLongAndLat } from "./utils"
import axios from "axios"
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material"
import { usePlacesWidget } from "react-google-autocomplete"
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked"
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward"
import { Header } from "./components/Header"

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
    const [sortBy, setSortBy] = useState<string>("")
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
    const [noLocationError, setNoLocationError] = useState<boolean>(false)
    const [currRating, setCurrRating] = useState<string>("4.0")
    const [currRatingError, setCurrRatingError] = useState<boolean>(false)
    const [numRating, setNumRating] = useState<string>("1000")
    const [numRatingError, setNumRatingError] = useState<boolean>(false)
    const [mileRange, setMileRange] = useState<string>("1.5")
    const [mileRangeError, setMileRangeError] = useState<boolean>(false)
    const [resLoading, toggleResLoading] = useState(false)
    const [results, setResults] = useState<Array<Result> | undefined>()

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
        const res = await axios.get(`/api/geturl?place_id=${placeId}`)
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
        if (!location || location === "loading") {
            setNoLocationError(true)
            return
        } else {
            setNoLocationError(false)
        }

        if (mileRangeError || currRatingError || numRatingError) {
            return
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

            <Box>
                <Header text={"Where are you?"} />
                {noLocationError && (!location || location === "loading") && (
                    <Alert severity="error">Select a location</Alert>
                )}
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
                    onInputChange={(event) => {
                        setAutocompleteLocationName((event.target as HTMLTextAreaElement).value)
                    }}
                    sx={{
                        display: locationOpt === "input" ? "block" : "none",
                    }}
                />
            </Box>

            <Divider />

            <Grid container gap={1}>
                <Header text={"What ratings?"} />
                <Typography variant="body1">
                    We&apos;ve found that top restaurants are usually &gt; 4.0 stars with &gt;1,000 reviews
                </Typography>
                <Grid container sx={{ paddingY: "0.5em" }}>
                    <Grid item xs={6}>
                        <TextField
                            label="Min. stars"
                            type="number"
                            onChange={(e) => {
                                setCurrRating(e.target.value)
                                if (
                                    e.target.value === "" ||
                                    parseFloat(e.target.value) <= 0 ||
                                    parseFloat(e.target.value) > 5
                                ) {
                                    setCurrRatingError(true)
                                } else {
                                    setCurrRatingError(false)
                                }
                            }}
                            value={currRating}
                            error={currRatingError}
                            helperText={currRatingError ? "Enter a number between 1 to 5" : ""}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="# reviews"
                            type="number"
                            onChange={(e) => {
                                setNumRating(e.target.value)
                                if (e.target.value === "" || parseFloat(e.target.value) <= 0) {
                                    setNumRatingError(true)
                                } else {
                                    setNumRatingError(false)
                                }
                            }}
                            value={numRating}
                            error={numRatingError}
                            helperText={numRatingError ? "Enter a positive number" : ""}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Divider />

            <Grid container gap={1}>
                <Header text={"What else?"} />
                <Grid container direction="row">
                    <TextField
                        label="Max miles away"
                        placeholder="1.5"
                        type="number"
                        onChange={(e) => {
                            setMileRange(e.target.value)
                            if (e.target.value === "" || parseFloat(e.target.value) <= 0) {
                                setMileRangeError(true)
                            } else {
                                setMileRangeError(false)
                            }
                        }}
                        value={mileRange}
                        error={mileRangeError}
                        helperText={mileRangeError ? "Enter a positive number" : ""}
                    />
                </Grid>
            </Grid>

            <Button
                onClick={() => search()}
                variant="contained"
                color="primary"
                disabled={currRatingError || numRatingError || mileRangeError}
            >
                {results && results.length > 0 ? "Search again" : "Find me food!"}
            </Button>

            <Divider />

            {resLoading && (
                <Grid container gap={2} direction="column" justifyContent="center" alignItems="center">
                    <CircularProgress />
                    <Typography variant="body1">Loading food 🤤</Typography>
                </Grid>
            )}

            {!resLoading && results && results.length > 0 && (
                <FormControl fullWidth>
                    <InputLabel id="filter-results-label">Sort by</InputLabel>
                    <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        labelId="filter-results-label"
                        variant="standard"
                    >
                        <MenuItem disabled selected value="">
                            Sort results by
                        </MenuItem>
                        <MenuItem value="distance-inc">Distance (Close to Far)</MenuItem>
                        <MenuItem value="distance-desc">Distance (Far to Close)</MenuItem>
                        <MenuItem value="price_level-inc">Cost (Cheap - Expensive)</MenuItem>
                        <MenuItem value="price_level-desc">Cost (Expensive to Cheap)</MenuItem>
                        <MenuItem value="reviews-inc">Reviews (Few to Many)</MenuItem>
                        <MenuItem value="reviews-desc">Reviews (Many - Few)</MenuItem>
                        <MenuItem value="stars-inc">Reviews (Worst to Best)</MenuItem>
                        <MenuItem value="stars-desc">Reviews (Best - Worst)</MenuItem>
                    </Select>
                </FormControl>
            )}

            {!resLoading &&
                results &&
                (results.length > 0 ? (
                    results.map(({ name, price_level, distance, reviews, stars, open_now, place_id }, index) => (
                        <Card key={index}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {name}
                                </Typography>
                                <Typography variant="body1">
                                    {stars} stars with {reviews} reviews
                                </Typography>
                                <Typography variant="body1">
                                    {Array(price_level).fill("$").join("")} · {distance.toFixed(2)} miles ·{" "}
                                    {open_now ? <span>Open now</span> : <span>Closed</span>}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ paddingTop: 0 }}>
                                <Button onClick={() => openMaps(place_id)}>Open in Google Maps</Button>
                            </CardActions>
                        </Card>
                    ))
                ) : (
                    <Alert severity="info">No results found</Alert>
                ))}
        </Grid>
    )
}

export default FindFood
