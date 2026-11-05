(d => {
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
})(document);