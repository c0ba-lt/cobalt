export default function() {
    const providers = process.env.ENABLED_PROXY_PROVIDERS || ''
    providers
    .split(',')
    .map(a => a.trim())
    .forEach(async providerName => {
        try {
           await (await import('./providers/' + providerName + '.js')).default()
        } catch(e) {
            console.error('warn: loading provier', providerName, 'failed:')
            console.error(e)
        }
    })
}