(() => {
  let { Math, document, innerWidth, innerHeight } = self;
  let { max, min } = Math;
  let { fullscreenElement } = document;
  let video = fullscreenElement;
  if (video?.tagName != "VIDEO") {
    let videos = (fullscreenElement ?? document).getElementsByTagName("video");
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
    video ?? ((video = fullscreenElement?.shadowRoot?.querySelector("VIDEO")) && !video.readyState || (video = 0));
  } else
    video.readyState || (video = 0);
  return video && [video.videoWidth, video.videoHeight, video.currentSrc];
})();