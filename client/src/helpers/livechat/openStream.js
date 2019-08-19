export function openStream(options, cb) {
  navigator.mediaDevices
    .getUserMedia(options)
    .then(stream => {
      cb(stream);
    })
    .catch(err => console.log(err));
}
