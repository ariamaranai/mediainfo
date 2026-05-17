(() => {
  let d = document;
  let video = d.fullscreenElement || d.scrollingElement;
  if (!(video instanceof HTMLVideoElement)) {
    let videos = video.getElementsByTagName("video");
    let wndW = innerWidth;
    let wndH = innerHeight;
    let maxVisibleSize = 0;
    let i = videos.length;
    while (i) {
      let _video = videos[--i];
      if (_video.readyState) {
        let { right, x, bottom, y } = _video.getBoundingClientRect();        
        let visibleW = (right < wndW ? right : wndW) - (x < 0 ? 0 : x);
        let visibleH = (bottom < wndH ? bottom : wndH) - (y < 0 ? 0 : y);
        let visibleSize = visibleW * visibleH;
        maxVisibleSize < visibleSize && (
          maxVisibleSize = visibleSize,
          video = _video
        );
      }
    }
    video?.readyState || (video = video.shadowRoot?.querySelector("video"));
  }
  return video?.readyState && [video.videoWidth, video.videoHeight, video.currentSrc];
})();