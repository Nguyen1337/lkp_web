function initChatBot(configurationFile = '/settings.json') {
	const e = window
	const t = document

	;(e.ThreadsWidget = { isDummy: !0 }),
		['hideInvite', 'version', 'commitHash', 'showChat', 'hideChat', 'onHideChat', 'onScenarios', 'onLoad'].forEach(function (t) {
			e.ThreadsWidget[t] = function (n) {
				let a, s, i

				;(a = t),
					(s = n),
					(i = setInterval(function () {
						e.ThreadsWidget && !e.ThreadsWidget.isDummy && (clearInterval(i), e.ThreadsWidget[a] && e.ThreadsWidget[a](s))
					}, 100))
			}
		})
	let n
	const a =
		((n = new XMLHttpRequest()),
		function (e, t, a, s) {
			;(n.onreadystatechange = function () {
				if (n.readyState === 4)
					if (this.status === 200) a(n.response)
					else {
						if (typeof s !== 'function') throw new Error(n.response)
						s(n)
					}
			}),
				n.open(e, t),
				n.send()
		})

	function s(e) {
		if (
			(e.webchat && (e.webchat.filename = e.filename),
			e.style && (e.webchat.style = e.style),
			sessionStorage.setItem('__threadsWidget', JSON.stringify(e.webchat)),
			e.filename)
		) {
			const n = t.createElement('script')

			;(n.type = 'text/javascript'), (n.async = !0), (n.src = e.filename)
			const a = t.getElementsByTagName('script')[0]

			a ? a.parentNode.insertBefore(n, a) : t.body.appendChild(n)
		} else console && console.error('Invalid bundle')
	}
	function i() {
		a('GET', configurationFile + '?rnd=' + Math.random(), function (e) {
			const t = JSON.parse(e)

			s(t)
		})
	}
	t.readyState === 'complete' ? i() : e.attachEvent ? e.attachEvent('onload', i) : e.addEventListener('load', i, !1)
}

if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    !('ThreadsWidget' in window)
    ) {
    initChatBot('https://static.mosmetro.ru/shared/chatbot/settings.dev.json')
}