import { CronJob } from 'cron'
import T2 from './T2'
import TPLINK from './TPLINK'
import config from './config'

const t2uu = new T2(config.t2)
const tplink = new TPLINK(config.tplink)

async function check () {
	const { used, total } = await t2uu.usage()
	if (used > total - config.bufferMB) await tplink.requestExtraGB()
}

new CronJob('17 */10 * * * *', check, null, true, 'Europe/Amsterdam')
