function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Strip /studio prefix so the studio bucket uses root paths
  if (uri === "/studio" || uri === "/studio/") {
    request.uri = "/index.html";
    return request;
  }

  if (uri.startsWith("/studio/")) {
    uri = uri.slice("/studio".length);
    if (uri === "") {
      request.uri = "/index.html";
      return request;
    }
    var last = uri.split("/").pop();
    if (last && last.indexOf(".") === -1) {
      request.uri = uri + "/index.html";
    } else {
      request.uri = uri;
    }
  }

  return request;
}
