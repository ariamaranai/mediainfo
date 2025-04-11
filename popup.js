chrome.runtime.onMessage.addListener(m => document.body.innerHTML = m);
ondragstart = () => !1;