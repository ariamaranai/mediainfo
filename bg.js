chrome.contextMenus.onClicked.addListener(async (info, { id: tabId, windowId }) => {
  chrome.action.setPopup({ popup: "popup.htm", tabId });
  try {
    (await chrome.windows.get(windowId)).state == "fullscreen" && await chrome.windows.update(windowId, { state: "maximized" });
    if (info.mediaType == "image") {
      let url = info.srcUrl;
      let res = await fetch (url);
      let format = res.headers.get("content-type");
      let b = (await res.clone().bytes()).length;
      let localeFilesize = b.toLocaleString("en-US");
      let bmp = await createImageBitmap(await res.blob());
      chrome.action.openPopup(() =>
        chrome.runtime.sendMessage(
          "<a target=_blank href=" + url + ">" + url + "</a>\n" + bmp.width + " x " + bmp.height + "\n" + (
            b > 1023 && b < 1073741824
              ? (b < 1048576 ? (b / 1024).toFixed(1) + " KB (" : (b / 1048576).toFixed(1) + " MB (") + localeFilesize + " bytes)\n"
              : localeFilesize + "Bytes\n"
          ) + format
        )
      );
    } else {
      let { frameId } = info;
      let results =  await chrome.userScripts.execute({
        target: frameId ? { tabId, frameIds: [frameId] } : { tabId, allFrames: !0 },
        js: [{ code:
`(() => {
  let d = document;
  let video = document.body.getElementsByTagName("video");
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
    return [video.videoWidth, video.videoHeight, src];
  }
})();`
        }]
      });
      if (results) {
        let i = results.length;
        let result;
        let r = [0];
        while (
          (result = results[--i].result) && r[0] < result[0] && (r = result), 
          i
        );
        if (r.length > 1) {
          let url = r[2];
          let html = "<a target=_blank href=" + url + ">" + url + "</a>\n" + r[0] + " x " + r[1];
          url[0] != "b"
            ? await new Promise(resolve => {
                let f = item => {
                  if (item.url == url) {
                    chrome.downloads.cancel(item.id);
                    chrome.downloads.onCreated.removeListener(f);
                    let b = item.totalBytes;
                    let localeFilesize = b.toLocaleString("en-US");
                    chrome.action.openPopup(() =>
                      chrome.runtime.sendMessage(
                        html + "\n" + (
                          b > 1023 && b < 1099511627775
                            ? (b < 1048576 ? (b / 1024).toFixed(1) + " KB (" : b < 1073741824 ? (b / 1048576).toFixed(1) + " MB (" : (b / 1073741824).toFixed(1)  + " GB (") + localeFilesize + " bytes)"
                            : localeFilesize + "Bytes"
                          )
                        )
                      );
                    resolve();
                  }
                }
                chrome.downloads.onCreated.addListener(f);
                chrome.downloads.download({ url });
              })
            : chrome.action.openPopup(() => chrome.runtime.sendMessage(html));
        }
      }
    }
  } catch (e) {}
  chrome.action.setPopup({ popup: "", tabId });
});
chrome.runtime.onInstalled.addListener(() =>
  chrome.contextMenus.create({
    id: "",
    title: "View info",
    contexts: ["page", "frame", "image", "video"],
    documentUrlPatterns: ["https://*/*", "http://*/*", "file://*"]
  })
);