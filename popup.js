chrome.runtime.onMessage.addListener(m => {
  let { body } = document;
  let a = body.firstChild;
  a.href = a.textContent = m[0];
  body.append(m[1]);
});
ondragstart = () => !1;
