import { addProxy } from '../manager.js'

export default async function() {
    /** `username` and `password` are NOT your actual username and password.
     ** to get these, see: https://gist.github.com/dumbmoron/2a4864dc68f510bffedfebd201dea5dd **/
    if (!process.env.NORDVPN_USERNAME || !process.env.NORDVPN_PASSWORD)
        throw 'nordvpn: username/password not set'

    const url = new URL('https://nordvpn.com/wp-admin/admin-ajax.php')
          url.searchParams.set('action', 'servers_recommendations')
          url.searchParams.set('limit', 1e6)
          url.searchParams.set('filters', JSON.stringify({ servers_technologies: [ 21 ] }))

    const req = await fetch(url)
    const res = await req.json()

    res
    .filter(s => s.locations.length === 1)
    .map(s => {
        const url = new URL(`https://${s.hostname}:89/`)
              url.username = process.env.NORDVPN_USERNAME
              url.password = process.env.NORDVPN_PASSWORD

        const code = s.locations[0].country.code.toLowerCase()
        return [ url, code ]
    })
    .forEach(([ url, country ]) => addProxy(url, country))
}