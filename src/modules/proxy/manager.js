import { socksDispatcher } from 'fetch-socks'
import { ProxyAgent } from 'undici'
import { strict as assert } from 'assert'

const proxies = {}
const rand = (a) => a[Math.floor(Math.random() * a.length)]
const PROTO_SOCKS_TEST_REGEX = /^socks\d?:/
const PROTO_SOCKS_PARSE_REGEX = /^socks(\d):/
const COUNTRY_CODE_TEST_REGEX = /^[a-z]{2}$/

function createDispatcher(url) {
    assert(url instanceof URL)
    if (PROTO_SOCKS_TEST_REGEX.test(url.protocol)) {
        const type = Number(url.protocol.match(PROTO_SOCKS_PARSE_REGEX)?.[1]) || 5
        return socksDispatcher({
            type,
            host: url.hostname,
            port: Number(url.port) || 1080,
            userId: url.username   || undefined,
            password: url.password || undefined,
        })
    }

    return new ProxyAgent(url.toString())
}

export function addProxy(url, country) {
    if (!COUNTRY_CODE_TEST_REGEX.test(country))
        throw 'invalid country code'

    if (typeof url === 'string')
        url = new URL(url)
    else if (!(url instanceof URL))
        throw 'invalid URL'
    
    if (!proxies[country])
        proxies[country] = []

    proxies[country].push(url)
}

export function removeProxy(url, country) {
    if (!proxies[String(country)])
        return

    url = new URL(url)
    proxies[country] = proxies[country].filter(u => u.toString() !== url.toString())
    if (proxies[country].length === 0)
        proxies[country] = undefined
}

export function randomProxyFrom(country) {
    if (country === 'any')
        country = rand(getCountries())

    if (!proxies[country])
        return undefined

    return createDispatcher(rand(proxies[country]))
}

export function getCountries() {
    return Object.keys(proxies)
}
