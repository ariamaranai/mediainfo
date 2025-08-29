chrome.contextMenus.onClicked.addListener(async (info, { id: tabId, windowId }) => {
  try {
    await chrome.action.setPopup({ popup: "popup.htm", tabId });
    (await chrome.windows.get(windowId)).state == "fullscreen" &&
    await chrome.windows.update(windowId, { state: "maximized" });
    if (info.mediaType == "image") {
      let url = info.srcUrl;
      let r = await fetch(url);
      let blob = await r.blob();
      let { size } = blob;
      let localeSize = size.toLocaleString("en-US");
      let bmp = await createImageBitmap(blob);
      chrome.action.openPopup(() =>
        chrome.runtime.sendMessage([
          url,
          bmp.width + " x " + bmp.height + "\n" + (
            size > 1023 && size < 1073741824
              ? (size < 1048576 ? (size / 1024).toFixed(1) + " KB (" : (size / 1048576).toFixed(1) + " MB (") + localeSize + " bytes)\n"
              : localeSize + "Bytes\n"
          ) + blob.type
        ])
      );
    } else {
      let results =  await chrome.userScripts.execute({
        target: { tabId, allFrames: !0 },
        js: [{ file: "video.js" }]
      });
      if (results) {
        let i = results.length;
        let rs = [0];
        let result;
        while (
          (result = results[--i].result) && r[0] < result[0] && (r = result), 
          i
        );
        if (rs.length > 1) {
          let url = rs[2];
          let wxh = rs[0] + " x " + rs[1];
          url[0] != "b"
            ? await new Promise(resolve => {
                let f = item => {
                  if (item.url == url) {
                    chrome.downloads.cancel(item.id);
                    chrome.downloads.onCreated.removeListener(f);
                    let size = item.totalBytes;
                    let localeSize = size.toLocaleString("en-US");
                    chrome.action.openPopup(() =>
                      chrome.runtime.sendMessage([
                        url,
                        wxh + (
                          size > 1023 && size < 1099511627775
                            ? (size < 1048576 ? (size / 1024).toFixed(1) + " KB (" : size < 1073741824 ? (size / 1048576).toFixed(1) + " MB (" : (size / 1073741824).toFixed(1)  + " GB (") + localeSize + " bytes)"
                            : localeSize + "Bytes"
                          )
                        ])
                      );
                    resolve();
                  }
                }
                chrome.downloads.onCreated.addListener(f);
                chrome.downloads.download({ url });
              })
            : chrome.action.openPopup(() => chrome.runtime.sendMessage([url, wxh]));
        }
      }
    }
  } catch {}
});
chrome.runtime.onInstalled.addListener(() =>
  chrome.contextMenus.create({
    id: "",
    title: "View info",
    contexts: ["page", "frame", "image", "video"],
    documentUrlPatterns: ["https://*/*", "http://*/*", "file://*"]
  })
);