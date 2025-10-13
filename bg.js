chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    let tabId = tab.id;
    let { srcUrl } = info;
    let finalUrl = 0;
    let totalBytes = 0;
    let dimension = "";
    let mime = 0;
    let download = url => new Promise(resolve => {
      let onCreated = item => {
        chrome.downloads.cancel(item.id);
        chrome.downloads.onCreated.removeListener(onCreated);
        let _mime = item.mime;
        (_mime.includes("image") || _mime.includes("video")) && (
          finalUrl = item.finalUrl,
          totalBytes = item.totalBytes,
          mime = _mime
        );
        resolve()
      }
      chrome.downloads.onCreated.addListener(onCreated);
      chrome.downloads.download({ url });
    });
    let target = { tabId, allFrames: !0 };
    if (info.mediaType == "image") {
      await download(srcUrl);
      let { result } = (await chrome.userScripts.execute({
          target,
          js: [{
            code: '(a=>a&&a.naturalWidth+" x "+a.naturalHeight)([...document.images].find(e=>e.currentSrc=="' + srcUrl + '"))'
          }]
        }))[0];
        result && (dimension = result);
    } else {
      let results =  await chrome.userScripts.execute({
        target,
        js: [
          srcUrl
          ? { code: '(a=>a&&[a.videoWidth,a.videoHeight,a.currentSrc])([...document.getElementsByTagName("video")].find(e=>e.currentSrc=="' + srcUrl + '"))' }
          : { file: "video.js" }
        ]
      });
      let { result } = results.reduce((a, b) => a.result[0] < b.result[0] ? b : a);
      if (result) {
        dimension = result[0] + " x " + result[1];
        await download(srcUrl ??= result[2]);
        if (!totalBytes) {
          let tabUrl = tab.url;
          let addRules = [{
            id: 1,
            priority: 2147483647,
            action: {
              type: "modifyHeaders",
              requestHeaders: [
                {
                  header: "origin",
                  operation: "set",
                  value: (new URL(tabUrl)).origin
                },
                {
                  header: "referer",
                  operation: "set",
                  value: tabUrl
                }
              ]
            },
            condition: {
              resourceTypes: ["xmlhttprequest"],
              urlFilter: "|" + srcUrl + "|"
            }
          }];
          await chrome.declarativeNetRequest.updateSessionRules({ addRules });
          let controller = new AbortController;
          finalUrl = (await fetch(srcUrl, { redirect: "follow", signal: controller.signal })).url || srcUrl;
          controller.abort();
          addRules[0].condition.urlFilter = "|" + finalUrl + "|";
          await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1],
            addRules
          })
          let { headers } = await fetch (finalUrl, { method: "HEAD" });
          totalBytes = +(headers.get("content-length"));
          mime = headers.get("content-type");
          chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1]
          });
        }
      }
    }
    if (totalBytes) {
      let localeTotalBytes = totalBytes.toLocaleString("en-US");
      dimension += "\n" +
      (totalBytes > 1023 && totalBytes < 1099511627775
        ? (totalBytes < 1048576 ? (totalBytes / 1024).toFixed(1) + " KB (" : totalBytes < 1073741824 ? (totalBytes / 1048576).toFixed(1) + " MB (" : (totalBytes / 1073741824).toFixed(1)  + " GB (") + localeTotalBytes + " bytes) "
        : localeTotalBytes + " Bytes ") +
      mime;
    }
    let { windowId } = tab;
    (await chrome.windows.get(windowId)).state == "fullscreen" &&
    await chrome.windows.update(windowId, { state: "maximized" });
    await chrome.action.setPopup({ popup: "popup.htm", tabId });
    await chrome.action.openPopup();
    chrome.runtime.sendMessage([finalUrl, dimension]);
  } catch {
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [1]
    });
  }
});
chrome.runtime.onInstalled.addListener(() =>
  chrome.contextMenus.create({
    id: "",
    title: "View info",
    contexts: ["page", "frame", "image", "video"],
    documentUrlPatterns: ["https://*/*", "http://*/*", "file://*"]
  })
);