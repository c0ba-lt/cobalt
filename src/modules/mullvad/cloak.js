import { getCountries, getServersForCountry } from './api.js'
import { SocksProxyAgent } from 'socks-proxy-agent'

const rand = a => a[Math.floor(Math.random() * a.length)]

const getRandomServerForCountry = async country => {
    const relays = await getServersForCountry(country)
    if (relays) return rand(relays)
}

const randomProxy = async (from = null) => {
    if (!from)
        return randomProxy(rand(await getCountries()))

    const hostname = await getRandomServerForCountry(from)
    if (!hostname) return randomProxy()
    return new SocksProxyAgent(`socks://${hostname}`)
}

export default randomProxy
