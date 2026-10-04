{
  let { action, contextMenus, declarativeNetRequest, downloads, runtime, scripting, windows } = chrome;
  onunhandledrejection = e => (
    e.preventDefault(),
    declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] })
  );
  contextMenus.onClicked.addListener(async (info, tab) => {
    let finalUrl;
    let totalBytes = 0;
    let dimension = "";
    let mime = "";
    let download = url => new Promise(resolve => {
      let onCreated = item => {
        downloads.cancel(item.id);
        downloads.onCreated.removeListener(onCreated);
        let _mime = item.mime;
        return resolve((_mime.startsWith("image") || _mime.startsWith("video")) && (
          finalUrl = item.finalUrl,
          totalBytes = item.totalBytes,
          mime = _mime
        ));
      }
      downloads.onCreated.addListener(onCreated);
      return downloads.download({ url });
    });
    let tabId = tab.id;
    let target = { tabId, allFrames: !0 };
    let srcUrl = info.srcUrl;
    if (info.mediaType == "image") {
      await download(srcUrl);
      let result = (await scripting.executeScript({
        target,
        args: [srcUrl],
        func: srcUrl => {
          let images = document.images;
          let i = images.length;
          while (i) {
            let image = images[--i];
            if (image.currentSrc == srcUrl)
              return [image.naturalWidth, image.naturalHeight];
            }
          }
      }))[0].result;
      result && (dimension = result[0] + " x " + result[1] + " (" + result[0] / result[1] + ")");
    } else {
      let results = await scripting.executeScript(
        srcUrl
          ? {
            target,
            args: [srcUrl],
            func: srcUrl => {
              let videos = document.getElementsByTagName("video");
              let i = videos.length;
              while (i) {
                let video = videos[--i];
                if (video.currentSrc === srcUrl)
                  return [video.videoWidth, video.videoHeight, video.currentSrc];
              }
              return 0;
            }
          }
          : {
            target,
            files: ["video.js"]
          }
      );
      let result = results.reduce((best, v) => v.result && (!best || best.result[0] < v.result[0]) ? v : best, null)?.result;
      if (result) {
        dimension = result[0] + " x " + result[1];
        await download(srcUrl ??= result[2]);
        if (!totalBytes) {
          if (srcUrl[0] === "b")
            finalUrl = srcUrl;
          else {
            let tabUrl = tab.url;
            let addRules = [{
              id: 1,
              priority: 2147483647,
              action: {
                type: "modifyHeaders",
                requestHeaders: [{
                  header: "origin",
                  operation: "set",
                  value: (new URL(tabUrl)).origin
                }, {
                  header: "referrer",
                  operation: "set",
                  value: tabUrl
                }]
              },
              condition: {
                resourceTypes: ["xmlhttprequest"],
                urlFilter: "|" + srcUrl + "|"
              }
            }];
            await declarativeNetRequest.updateSessionRules({ addRules });
            let controller = new AbortController;
            finalUrl = (await fetch(srcUrl, { redirect: "follow", signal: controller.signal })).url;
            controller.abort();
            addRules[0].condition.urlFilter = "|" + finalUrl + "|";
            await declarativeNetRequest.updateSessionRules({
              removeRuleIds: [1],
              addRules
            });
            let { headers } = await fetch(finalUrl, { method: "HEAD" });
            totalBytes = +headers.get("content-length");
            mime = headers.get("content-type");
            declarativeNetRequest.updateSessionRules({
              removeRuleIds: [1]
            });
          }
        }
      }
    }
    if (totalBytes) {
      let localeTotalBytes = totalBytes.toLocaleString();
      dimension += "\n" +
        (totalBytes > 1023 && totalBytes < 1099511627775
          ? (totalBytes < 1048576 ? (totalBytes / 1024).toFixed(1) + " KB (" : totalBytes < 1073741824 ? (totalBytes / 1048576).toFixed(1) + " MB (" : (totalBytes / 1073741824).toFixed(1) + " GB (") + localeTotalBytes + " bytes) "
          : localeTotalBytes + " Bytes ") +
        mime;
    }
    return windows.get(tab.windowId, window => (
      window.state === "fullscreen" && windows.update(window.id, { state: "maximized" }),
      action.setPopup({ popup: "popup.htm", tabId }),
      action.openPopup(() => runtime.sendMessage([finalUrl, dimension]))
    ));
  });
  runtime.onInstalled.addListener(() =>
    contextMenus.create({
      id: "",
      title: "View info",
      contexts: ["page", "frame", "image", "video"],
      documentUrlPatterns: ["https://*/*", "http://*/*", "file://*"]
    })
  );
}
