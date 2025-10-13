(() => {
  let video = document.fullscreenElement || document.scrollingElement;
  if (video.tagName != "VIDEO") {
    let videos = video.getElementsByTagName("VIDEO");
    let { max, min } = Math;
    let maxVisibleSize = 0;
    let i = 0;
    while (i < videos.length) {
      let _video = videos[i];
      if (_video.readyState) {
        let { x, right, y, bottom } = _video.getBoundingClientRect();
        let visibleSize = max(min(right, innerWidth) - max(x, 0), 0) * max(min(bottom, innerHeight) - max(y, 0), 0);
        maxVisibleSize < visibleSize && (
          maxVisibleSize = visibleSize,
          video = _video
        );
      }
      ++i;
    }
    video?.readyState || (video = video.shadowRoot?.querySelector("VIDEO"))?.readyState || (video = 0);
  } else
    video.readyState || (video = 0);
  return video && [video.videoWidth, video.videoHeight, video.currentSrc];
})();