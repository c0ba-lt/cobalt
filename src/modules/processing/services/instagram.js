import { genericUserAgent } from "../../config.js";

export default async function(obj) {
    let html;
    try {
        html = await (
            await fetch(`https://www.instagram.com/p/${obj.id}/`, {
                headers: {
                    'user-agent': genericUserAgent,
                    'origin': 'https://www.instagram.com',
                    'accept-language': 'en-US;q=0.8,en;q=0.7',
                    'sec-fetch-site': 'none',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-dest': 'document'
                },
                dispatcher: obj.dispatcher
            })
        ).text()
    } catch (e) {
        html = false;
    }

    if (!html) return { error: 'ErrorCouldntFetch' };
    if (!html.includes('application/ld+json')) return { error: 'ErrorEmptyDownload' };

    let single, multiple = [], postInfo = JSON.parse(html.split('script type="application/ld+json"')[1].split('">')[1].split('</script>')[0]);
    if (Array.isArray(postInfo)) postInfo = postInfo[0];

    if (postInfo.video.length > 1) {
        for (let i in postInfo.video) { multiple.push({type: "video", thumb: postInfo.video[i]["thumbnailUrl"], url: postInfo.video[i]["contentUrl"]}) }
    } else if (postInfo.video.length === 1) {
        single = postInfo.video[0]["contentUrl"]
    } else {
        return { error: 'ErrorEmptyDownload' }
    }

    if (single) {
        return { urls: single, filename: `instagram_${obj.id}.mp4`, audioFilename: `instagram_${obj.id}_audio` }
    } else if (multiple) {
        return { picker: multiple }
    } else {
        return { error: 'ErrorEmptyDownload' }
    }
}
