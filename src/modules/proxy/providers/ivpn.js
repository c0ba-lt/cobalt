import * as ProxyManager from '../manager.js'

const SHOULD_CHAIN = process.env.USE_CHAINING === '1'

export default async function() {
    const req = await fetch('https://api.ivpn.net/v4/servers/stats')
    const res = await req.json()

    res.servers
    .filter(r => r.is_active && !r.in_maintenance && r.socks5)
    .forEach(
        relay => ProxyManager.addProxy(
            `socks5://${relay.socks5.split(':')[0]}/`,
            relay.country_code.toLowerCase(),
            SHOULD_CHAIN ? [ 'socks5://ivpn/' ] : undefined
        )
    )
}