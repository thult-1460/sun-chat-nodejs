export function playVideo(stream, videoElementId) {
  let videoElement = document.getElementById(videoElementId);

  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = function() {
    videoElement.play();
  };
}
