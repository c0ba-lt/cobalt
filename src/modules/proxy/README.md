### big picture
- we have providers which add (and remove, if need be) proxies from/into ProxyManager
    - they live in the `providers/` directory
- providers are enabled via the `ENABLED_PROXY_PROVIDERS` environment variable
    - comma delimited, specifies which files from `providers/` to load
    - e.g. `ENABLED_PROXY_PROVIDERS=mullvad,static`
    - if empty or nonexistent, the instance does not use proxies
- behavior of the `any` country:
    - if `PROXY_EVERYTHING` is 1, it picks a country at random
    - otherwise, it does not use a proxy

### Provider
- exports at least a default function
- function does not take any parameters (it can, but the loader will not pass it any)
- for examples, see the `providers` directory

### ProxyManager
- global object that holds proxies
- `type countryCode = string[2]` always lowercased
    - `/^[a-z]{2}$/.test(countryCode) === true`

changing the proxy list:
- `ProxyManager.removeProxy(url: string | URL, country: countryCode) -> void`
- `ProxyManager.addProxy(url: string | URL, country: countryCode) -> void`

view functions:
- `ProxyManager.getCountries() ~> Array[countryCode]`
- `ProxyManager.randomProxyFrom(country: countryCode | 'any') -> undici.Dispatcher?`
