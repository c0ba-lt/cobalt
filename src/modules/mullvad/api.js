const relays = {}
let loaded = false

const _load = async () => {
    const req = await fetch('https://api.mullvad.net/www/relays/wireguard')
    const res = await req.json()

    loaded = true
    res
    .filter(r => r.active && r.socks_name)
    .forEach(relay => {
        if (!(relay.country_code in relays))
            relays[relay.country_code] = []

        relays[relay.country_code].push(relay.socks_name)
    })
}

const getCountries = async () => {
    if (!loaded) await _load()
    return Object.keys(relays)
}

const getServersForCountry = async country => {
    if (!loaded) await _load()
    return relays[country]
}

export { getCountries, getServersForCountry }
