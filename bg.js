{
  let { action, contextMenus, declarativeNetRequest, downloads, runtime, scripting, windows } = chrome;
  onunhandledrejection = e => (
    e.preventDefault(),
    declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] })
  );
  contextMenus.onClicked.addListener((info, tab) => {
    let finalUrl;
    let totalBytes = 0;
    let dimension = "";
    let mime = "";
    let srcUrl = info.srcUrl;
    let isImage = info.mediaType === "image";
    let onDownloadsCreated;
    let tabId = tab.id;
    Promise.all([
      scripting.executeScript({
        target: { tabId, allFrames: !0 },
        world: "MAIN",
        args: (isImage || srcUrl) ? [srcUrl] : null,
        func:
          isImage ?
            srcUrl => {
              let images = document.images;
              let i = images.length;
              while (i) {
                let image = images[--i];
                if (image.currentSrc == srcUrl)
                  return (image = image.naturalWidth) + " x " + (i = image.naturalHeight) + "(" + image / i + ")";
              }
            } :
          srcUrl ?
            srcUrl => {
              let videos = document.getElementsByTagName("video");
              let i = videos.length;
              while (i) {
                let video = videos[--i];
                if (video.currentSrc === srcUrl)
                  return [video.videoWidth, video.videoHeight, video.currentSrc];
              }
            } :
            () => {
              let d = document;
              let video = d.fullscreenElement;
              if (video?.localName !== "video") {
                let wndW = innerWidth;
                let wndH = innerHeight;
                let maxVisibleSize = 0;
                let target = video ?? d;
                let videos = target.getElementsByTagName("video");
                let shadowRoot = target.shadowRoot;
                shadowRoot &&
                (shadowRoot = shadowRoot.querySelectorAll("video")).length &&
                (videos = [...videos, ...shadowRoot]);
                let i = videos.length;
                while (i) {
                  let v = videos[--i];
                  if (v.readyState) {
                    let { right: $0, x, bottom, y } = v.getBoundingClientRect();
                    maxVisibleSize < ($0 = (($0 < wndW ? $0 : wndW) - (x < 0 ? 0 : x)) * ((bottom < wndH ? bottom : wndH) - (y < 0 ? 0 : y))) && (
                      maxVisibleSize = $0,
                      video = v
                    );
                  }
                }
              }
              return video && video.readyState && [video.videoWidth, video.videoHeight, video.currentSrc];
            }
      }).then(results => {
        let i = results.length;
        if (isImage) {
          while (i && !(dimension = results[--i].result));
        } else {
          let videoData;
          let i = results.length;
          while (i) {
            let result = results[--i].result;
            result && ((!videoData || videoData[0] < (result = result[0])) && (videoData = result))
          }
          if (videoData) {
            downloads.onCreated.addListener(onDownloadsCreated);
            downloads.download({ url: srcUrl ??= videoData[2] });
            dimension = videoData[0] + " x " + videoData[1];
          }
        }
      }),
      windows.get(tab.windowId)
      .then(window => (
        window.state === "fullscreen" && windows.update(window.id, { state: "maximized" }),
        action.setPopup({ popup: "popup.htm", tabId })
      )),
      new Promise(resolve => {
        onDownloadsCreated = item => {
          downloads.cancel(item.id);
          downloads.onCreated.removeListener(onDownloadsCreated);
          finalUrl = item.finalUrl;
          mime = item.mime;
          if ((totalBytes = item.totalBytes) || srcUrl[0] === "b")
            return resolve();
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
                  header: "referrer",
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
          declarativeNetRequest.updateSessionRules({ addRules }, () =>
            fetch(srcUrl, { redirect: "follow", signal: controller.signal })
            .then(r => {
              addRules[0].condition.urlFilter = "|" + (finalUrl = r.url) + "|";
              declarativeNetRequest.updateSessionRules({
                removeRuleIds: [1],
                addRules
              }, () => {
                fetch(finalUrl, { method: "HEAD" })
                .then(({ headers }) => (
                  declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [1]
                  }),
                  totalBytes = +headers.get("content-length"),
                  mime = headers.get("content-type"),
                  resolve()
                ))
              });
              controller.abort();
            })
          );
          let controller = new AbortController;
        }
        isImage && (
          downloads.onCreated.addListener(onDownloadsCreated),
          downloads.download({ url: srcUrl })
        )
      }),
    ]).then(() => (
      action.openPopup(() => runtime.sendMessage([finalUrl, dimension])),
      totalBytes && (
        dimension += "\n" + (
          totalBytes > 1023 && totalBytes < 1099511627775
            ? (totalBytes < 1048576 ? (totalBytes / 1024).toFixed(1) + " KB (" : totalBytes < 1073741824 ? (totalBytes / 1048576).toFixed(1) + " MB (" : (totalBytes / 1073741824).toFixed(1) + " GB (") + totalBytes.toLocaleString() + " bytes) "
            : totalBytes.toLocaleString() + " Bytes "
        ) + mime
      )
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
