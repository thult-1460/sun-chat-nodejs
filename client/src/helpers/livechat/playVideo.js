export function playVideo(stream, videoElement) {
  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = function() {
    videoElement.play();
  };
}
