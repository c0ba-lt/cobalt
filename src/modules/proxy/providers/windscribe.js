import { addProxy } from '../manager.js'

export default async function() {
    /** `username` and `password` are NOT your actual username and password.
     ** to get these, see: https://gist.github.com/dumbmoron/020300e30de3a0b29c28c3bb4af061cd
     ** if you don't have a premium account, it might work, but it is not supported by me **/
    if (!process.env.WINDSCRIBE_USERNAME || !process.env.WINDSCRIBE_PASSWORD)
        throw 'windscribe: username/password not set'

    const req = await fetch('https://assets.windscribe.com/serverlist/chrome/1/1')
    const res = await req.json()

    res.data
    .filter(c => c.country_code !== 'AQ' && c.country_code.length === 2)
    .forEach(c => {
        const proxies = c.groups.map(g => {
            return (g.hosts || []).map(s => {
                const url = new URL(`https://${s.hostname}/`)
                      url.username = process.env.WINDSCRIBE_USERNAME
                      url.password = process.env.WINDSCRIBE_PASSWORD
                return url
            })
        }).flat(1)

        for (const proxy of proxies) {
            addProxy(
                proxy,
                c.country_code.toLowerCase()
            )
        }
    })
}