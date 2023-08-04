import { getCountries, getServersForCountry } from './api.js'
import { socksDispatcher } from "fetch-socks";

const rand = a => a[Math.floor(Math.random() * a.length)]

const getRandomServerForCountry = async country => {
    const relays = await getServersForCountry(country)
    if (relays) return rand(relays)
}

const randomProxy = async (from = null) => {
    if (!from)
        return randomProxy(rand(await getCountries()))

    const host = await getRandomServerForCountry(from)
    if (!host) return randomProxy()
    console.log(`using ${host}`)
    return socksDispatcher({ type: 5, host, port: 1080 })
}

export default randomProxy
