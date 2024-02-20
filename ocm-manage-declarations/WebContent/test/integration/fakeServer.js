sap.ui.define([], function() {
  "use strict";
  var server;

  var oServerFacade = {
    start: function() {
      server = sinon.fakeServer.create();
      server.xhr.useFilters = true;
      server.autoRespond = true;
      sinon.fakeServer.xhr.addFilter(function(method, url) {
        return url.indexOf("/xp/api") === -1;
      });

      server.respondWith("GET", /\/product-data\/(.+)\?/, function(xhr, id) {
        xhr.respond(
          200,
          { "Content-Type": "application/json" },
          '[{ "id": "' + id + '" , "data": "Product Data"}]'
        );
      });
    },

    stop: function() {
      if (server) {
        server.restore();
        server = null;
      }
    }
  };

  return oServerFacade;
});
