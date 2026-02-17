function handler(event) {
  var request = event.request;
  var uri = request.uri || '';

  if (uri.startsWith('/studio-data/')) {
    request.uri = uri.slice('/studio-data'.length);
  } else if (uri === '/studio-data') {
    request.uri = '/';
  }

  return request;
}
