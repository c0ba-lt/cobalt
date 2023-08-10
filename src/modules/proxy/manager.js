import { socksDispatcher } from 'fetch-socks'
import { ProxyAgent } from 'undici'
import { strict as assert } from 'assert'

const proxies = {}
const rand = (a) => a[Math.floor(Math.random() * a.length)]
const PROTO_SOCKS_TEST_REGEX = /^socks\d?:/
const PROTO_SOCKS_PARSE_REGEX = /^socks(\d):/
const COUNTRY_CODE_TEST_REGEX = /^[a-z]{2}$/

function createProxyToken(url) {
    if (!url.username && !url.password)
        return undefined

    return 'Basic '
            + Buffer.from(
                [
                    url.username || '' ,
                    url.password || ''
                ].join(':')
            ).toString('base64')
}

function createDispatcher(proxyData) {
    const { url, via } = proxyData
    assert(url instanceof URL)
    assert(via === undefined || Array.isArray(via))

    if (PROTO_SOCKS_TEST_REGEX.test(url.protocol)) {
        return socksDispatcher(
            [...via, url].map(u => {
                if (u === null)
                    return null;

                return {
                    type: Number(
                        u.protocol
                        .match(PROTO_SOCKS_PARSE_REGEX)?.[1]
                    ) || 5,
                    host: u.hostname,
                    port: Number(u.port) || 1080,
                    userId: url.username   || undefined,
                    password: url.password || undefined,
                }
            }).filter(a => a)
        )
    }
    
    if (via && via.length > 0)
        throw '`via` only supported for socks proxies'

    return new ProxyAgent({
        uri: url.toString(),
        token: createProxyToken(url)
    })
}

export function addProxy(url, country, via = []) {
    if (!COUNTRY_CODE_TEST_REGEX.test(country))
        throw 'invalid country code'

    if (typeof url === 'string')
        url = new URL(url)
    else if (!(url instanceof URL))
        throw 'invalid URL'
    
    if (!proxies[country])
        proxies[country] = []

    for (const i in via)
        via[i] = new URL(via[i])

    proxies[country].push({ url, via })
}

export function removeProxy(url, country) {
    if (!proxies[String(country)])
        return

    url = new URL(url)
    proxies[country] = proxies[country].filter(
        u => u.url.toString() !== url.toString()
    )

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
