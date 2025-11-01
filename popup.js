chrome.runtime.onMessage.addListener(m => {
  let { body } = document;
  body.append(m[1]);
  let a = body.firstChild;
  a.href = a.textContent = m[0];
});
ondragstart = () => !1;