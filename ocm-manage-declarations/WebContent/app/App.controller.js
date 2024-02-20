sap.ui.define(
  [
    "sap/ui/model/json/JSONModel",
    "com/ssp/ocm/manage/declarations/app/base/BaseController"
  ],
  function(JSONModel, BaseController) {
    "use strict";

    /**
     * Controller for the App View
     * @exports com/ssp/ocm/manage/declarations/app/App
     */
    return BaseController.extend("com.ssp.ocm.manage.declarations.app.App", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit: function() {
        // Initialize model to control busy for the application
        this._initAppViewModel();

        // Apply content density mode to root view
        this.getView().addStyleClass(
          this.getOwnerComponent().getContentDensityClass()
        );
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Initialize app view model
       * 	- busy: control busy state for app
       * 	- delay: control how many time passed after busy control is risen up
       * @public
       * @return {undefined}
       */
      _initAppViewModel: function() {
        var oViewModel,
          iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        oViewModel = new JSONModel({
          busy: false,
          delay: iOriginalBusyDelay
        });

        this.getOwnerComponent().setModel(oViewModel, "appView");
      }
    });
  }
);
