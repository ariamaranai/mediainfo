(() => {
  let d = document;
  let video = d.fullscreenElement || d.scrollingElement;
  if (video?.localName !== "video") {
    let videos = video.getElementsByTagName("video");
    let wndW = innerWidth;
    let wndH = innerHeight;
    let maxVisibleSize = 0;
    let i = videos.length;
    while (i) {
      let _video = videos[--i];
      if (_video.readyState) {
        let { right: $0, x, bottom, y } = _video.getBoundingClientRect();
        maxVisibleSize < ($0 = ($0 < wndW ? $ : wndW) - (x < 0 ? 0 : x) * (bottom < wndH ? bottom : wndH) - (y < 0 ? 0 : y)) && (
          maxVisibleSize = $0,
          video = _video
        );
      }
    }
    video?.readyState || (video = video.shadowRoot?.querySelector("video"));
  }
  return video?.readyState && [video.videoWidth, video.videoHeight, video.currentSrc];
})();
