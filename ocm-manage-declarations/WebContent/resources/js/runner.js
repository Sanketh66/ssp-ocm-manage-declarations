var Runner = {
  initialize: function() {
    "use strict";
    //App loading
    sap.ui.getCore().attachInit(function() {
      sap.ui.require(
        ["sap/m/Shell", "sap/ui/core/ComponentContainer"],
        function(Shell, ComponentContainer) {
          //Busy application
          sap.ui.core.BusyIndicator.show(0);

          new Shell({
            app: new ComponentContainer({
              name: "com.ssp.ocm.manage.declarations",
              height: "100%"
            }),
            appWidthLimited: false
          }).placeAt("content");
        }
      );
    });
  }
};

//Run initialization
Runner.initialize();
