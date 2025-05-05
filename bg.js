chrome.runtime.onInstalled.addListener(() =>
  chrome.contextMenus.create({
    id: "",
    title: "View info",
    contexts: ["page", "frame", "image", "video"],
    documentUrlPatterns: ["https://*/*", "http://*/*", "file://*"]
  })
);
chrome.contextMenus.onClicked.addListener((info, { id: tabId, windowId }) =>
    chrome.action.setPopup({
      popup: "popup.htm",
      tabId
    }, () => {
      if (info.mediaType == "image") {
        let url = info.srcUrl;
        fetch (url)
          .then(r => Promise.all([r.clone().blob(), r.bytes(), r.headers.get("content-type").slice(6)]))
            .then(r => Promise.all([createImageBitmap(r[0]), r[1].length.toLocaleString("en-US"), r[2]]))
              .then(r => (
                chrome.action.openPopup(() => chrome.runtime.sendMessage(
                  "url: <a target=_blank href=" + url + ">" + url + "</a>\nsize: " +
                  r[0].width +  " x " + r[0].height + "\nfilesize: " +  r[1] +  " bytes\nformat: " + r[2],
                )),
                chrome.action.setPopup({
                  popup: "",
                  tabId
                })
              )
          ).catch(() => 0);
      } else
        chrome.windows.get(windowId, async window => {
          window.state == "fullscreen" &&
          await chrome.windows.update(windowId, {
            state: "maximized"
          });
          try {
            let { frameId } = info;
            let results = (await chrome.userScripts.execute({
              target: frameId ? { tabId, frameIds: [frameId] } : { tabId, allFrames: !0 },
              js: [{ code:
`(() => {
  let d = document;
  let video = d.body.getElementsByTagName("video");
  let i = video.length;
  if (i) {
    let index = 0;
    if (d.head.childElementCount != 1) {
      let maxWidth = 0;
      let width = 0;
      while (
        maxWidth < (width = video[--i].offsetWidth) && (maxWidth = width, index = i),
        i
      );
    }
    let src = (video = video[index]).currentSrc;
    return "url: <a target=_blank href=" + src + ">" + src + "</a>\\nsize: " + video.videoWidth + " x " + video.videoHeight + "\\n";
  }
})();`
                }]
              })
            );
            (results &&= results.reduce((a, v) => a + (v.result || ""), "")) && (
              chrome.action.openPopup(() => chrome.runtime.sendMessage(results.slice(0, -1))),
              chrome.action.setPopup({
                popup: "",
                tabId
              })
            )
          } catch (e) {}
        })
  })
);