import cors from "cors";
import rateLimit from "express-rate-limit";
import { randomBytes } from "crypto";

const ipSalt = randomBytes(64).toString('hex');

import { version } from "../modules/config.js";
import { getJSON } from "../modules/api.js";
import { apiJSON, checkJSONPost, languageCode } from "../modules/sub/utils.js";
import { Bright, Cyan } from "../modules/sub/consoleText.js";
import stream from "../modules/stream/stream.js";
import loc from "../localization/manager.js";
import { sha256 } from "../modules/sub/crypto.js";
import { verifyStream } from "../modules/stream/manage.js";

export function runAPI(express, app, gitCommit, gitBranch, __dirname) {
    const corsConfig = process.env.cors === '0' ? {
        origin: process.env.CORS_URL,
        optionsSuccessStatus: 200
    } : {};

    const apiLimiter = rateLimit({
        windowMs: 60000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: req => sha256(getIP(req), ipSalt),
        handler: (req, res, next, opt) => {
            return res.status(429).json({
                "status": "rate-limit",
                "text": loc(languageCode(req), 'ErrorRateLimit')
            });
        }
    });
    const apiLimiterStream = rateLimit({
        windowMs: 60000,
        max: 25,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: req => sha256(getIP(req), ipSalt),
        handler: (req, res, next, opt) => {
            return res.status(429).json({
                "status": "rate-limit",
                "text": loc(languageCode(req), 'ErrorRateLimit')
            });
        }
    });
    
    const startTime = new Date();
    const startTimestamp = Math.floor(startTime.getTime());

    app.set('trust proxy', ['loopback', 'uniquelocal']);

    app.use('/api/:type', cors(corsConfig));
    app.use('/api/json', apiLimiter);
    app.use('/api/stream', apiLimiterStream);
    app.use('/api/onDemand', apiLimiter);

    app.use((req, res, next) => {
        try { decodeURIComponent(req.path) } catch (e) { return res.redirect('/') }
        next();
    });
    app.use('/api/json', express.json({
        verify: (req, res, buf) => {
            let acceptCon = String(req.header('Accept')) === "application/json";
            if (acceptCon) {
                if (buf.length > 720) throw new Error();
                JSON.parse(buf);
            } else {
                throw new Error();
            }
        }
    }));
    // handle express.json errors properly (https://github.com/expressjs/express/issues/4065)
    app.use('/api/json', (err, req, res, next) => {
        let errorText = "invalid json body";
        let acceptCon = String(req.header('Accept')) !== "application/json";

        if (err || acceptCon) {
            if (acceptCon) errorText = "invalid accept header";
            return res.status(400).json({
                status: "error",
                text: errorText
            });
        } else {
            next();
        }
    });
    app.post('/api/json', async (req, res) => {
        try {
            let lang = languageCode(req);
            let j = apiJSON(0, { t: "bad request" });
            try {
                let contentCon = String(req.header('Content-Type')) === "application/json";
                let request = req.body;
                if (contentCon && request.url) {
                    request.dubLang = request.dubLang ? lang : false;
    
                    let chck = checkJSONPost(request);
                    if (!chck) throw new Error();
    
                    j = await getJSON(chck.url, lang, chck);
                } else {
                    j = apiJSON(0, {
                        t: !contentCon ? "invalid content type header" : loc(lang, 'ErrorNoLink')
                    });
                }
            } catch (e) {
                j = apiJSON(0, { t: loc(lang, 'ErrorCantProcess') });
            }
            return res.status(j.status).json(j.body);
        } catch (e) {
            return res.destroy();
        }
    });

    app.get('/api/:type', (req, res) => {
        try {
            switch (req.params.type) {
                case 'stream':
                    if (req.query.t && req.query.h && req.query.e && req.query.t.toString().length === 21
                    && req.query.h.toString().length === 64 && req.query.e.toString().length === 13) {
                        let streamInfo = verifyStream(req.query.t, req.query.h, req.query.e);
                        if (streamInfo.error) {
                            return res.status(streamInfo.status).json(apiJSON(0, { t: streamInfo.error }).body);
                        }
                        if (req.query.p) {
                            return res.status(200).json({
                                status: "continue"
                            });
                        }
                        return stream(res, streamInfo);
                    } else {
                        let j = apiJSON(0, {
                            t: "stream token, hmac, or expiry timestamp is missing"
                        })
                        return res.status(j.status).json(j.body);
                    }
                case 'serverInfo':
                    return res.status(200).json({
                        version: version,
                        commit: gitCommit,
                        branch: gitBranch,
                        name: process.env.apiName || "unknown",
                        url: process.env.apiURL,
                        cors: process.env?.cors === "0" ? 0 : 1,
                        startTime: `${startTimestamp}`
                    });
                    break;
                default:
                    let j = apiJSON(0, {
                        t: "unknown response type"
                    })
                    return res.status(j.status).json(j.body);
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                text: loc(languageCode(req), 'ErrorCantProcess')
            });
        }
    });
    app.get('/api/status', (req, res) => {
        res.status(200).end()
    });
    app.get('/favicon.ico', (req, res) => {
        res.sendFile(`${__dirname}/src/front/icons/favicon.ico`)
    });
    app.get('/*', (req, res) => {
        res.redirect('/api/json')
    });

    app.listen(process.env.apiPort || 9000, '0.0.0.0', () => {
        console.log(`\n` +
            `${Cyan("cobalt")} API ${Bright(`v.${version}-${gitCommit} (${gitBranch})`)}\n` +
            `Start time: ${Bright(`${startTime.toUTCString()} (${startTimestamp})`)}\n\n` +
            `URL: ${Cyan(`${process.env.apiURL}`)}\n` +
            `Port: ${process.env.apiPort || 9000}\n`
        )
    });
}
