function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // /studio or /studio/ => /studio/index.html
  if (uri === "/studio" || uri === "/studio/") {
    request.uri = "/studio/index.html";
    return request;
  }

  // /studio/foo => /studio/foo/index.html when no extension
  if (uri.startsWith("/studio/")) {
    var last = uri.split("/").pop();
    if (last && last.indexOf(".") === -1) {
      request.uri = uri + "/index.html";
    }
  }

  return request;
}
