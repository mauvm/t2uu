import request from 'request-promise'

export default class TPLINK {
	constructor (options) {
		this.options = options
		this.separator = '\r\n'
	}

	call (body) {
		const host = `http://${this.options.host}`
		const token = new Buffer(this.options.password).toString('base64')

		body = (Array.isArray(body) ? body.join(this.separator) : body) + this.separator

		return request({
			url: `${host}/cgi?2`,
			method: 'POST',
			headers: {
				'Accept': '*/*',
				'Connection': 'keep-alive',
				'Content-Type': 'text/plain',
				'Cookie': `Authorization=Basic ${token}`,
				'DNT': '1',
				'Origin': host,
				'Referer': host,
			},
			gzip: true,
			body,
			resolveWithFullResponse: true,
			simple: true,
		}).then(({ statusCode, body }) => {
			if (statusCode !== 200) {
				throw new Error('Error response code: ' + statusCode)
			}
			if (body !== '[error]0') {
				throw new Error('Error response: ' + body)
			}
		})
	}

	async requestExtraGB () {
		const body = [
			'[LTE_SMS_SENDNEWMSG#0,0,0,0,0,0#0,0,0,0,0,0]0,3',
			'index=1',
			'to=1280',
			'textContent=NOG 1GB',
		]

		try {
			return this.call(body)
		} catch (err) {
			return this.call(body) // Retry
		}
	}
}
