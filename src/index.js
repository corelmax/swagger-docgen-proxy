// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { paths } from './FormatRequest'
import { init } from './init'

process.on('SIGINT', async () => {
    console.log(`saving api specs ... `)
    console.log(JSON.stringify(Object.fromEntries(paths)))
    process.exit(0)
})

init()
