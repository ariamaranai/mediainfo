(() => {
  let d = document;
  let video = d.body.getElementsByTagName("video");
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
})();