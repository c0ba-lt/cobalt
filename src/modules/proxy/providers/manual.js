import * as ProxyManager from '../manager.js'

export default async function() {
    const proxies = [
        'http://user:password@http-proxy.example:1000',
        'socks5://socks-proxy.example',
        'https://proxy.example:10000'
    ]

    for (const [ country, proxy ] of proxies)
        ProxyManager.addProxy(proxy, country)
}