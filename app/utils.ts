export function getLongAndLat() {
    return new Promise<GeolocationPosition | GeolocationPositionError>((resolve, reject) => {
        try {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (err) => reject(err),
                { timeout: 10000 },
            )
        } catch (err) {
            reject(err)
        }
    })
}
