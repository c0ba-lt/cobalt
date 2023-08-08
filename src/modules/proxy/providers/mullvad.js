import * as ProxyManager from '../manager.js'

export default async function() {
    const req = await fetch('https://api.mullvad.net/www/relays/wireguard')
    const res = await req.json()

    res
    .filter(r => r.active && r.socks_name)
    .forEach(
        relay => ProxyManager.addProxy(
            `socks5://${relay.socks_name}`,
            relay.country_code
        )
    )
}