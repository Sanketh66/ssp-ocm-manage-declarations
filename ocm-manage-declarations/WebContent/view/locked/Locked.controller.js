/* eslint-disable no-extra-parens */
/*global location */
sap.ui.define(
  [
    "com/ssp/ocm/manage/declarations/app/base/BaseController",
    "com/ssp/ocm/manage/declarations/app/model/models",
    "com/ssp/ocm/manage/declarations/app/services/ApiFacade",
    "com/ssp/ocm/manage/declarations/app/services/ConfigHelper",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/base/Log",
    "com/ssp/ocm/manage/declarations/app/domain/Tender",
    "com/ssp/ocm/manage/declarations/app/domain/DeclarationItem",
    "com/ssp/ocm/manage/declarations/app/domain/Bag"
  ],
  function(
    BaseController
  ) {
    "use strict";

    /**
     * Controller for the Review view
     * @exports com/ssp/ocm/manage/declarations/view/review/Review
     */
    return BaseController.extend(
      "com.ssp.ocm.manage.declarations.view.review.Main",
      {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function() {
          BaseController.prototype.onInit.apply(this);
        },

        onMessagePopoverBtnPress: function(oEvent) {
          this._oErrorPopover.toggle(oEvent.getSource());
        }
      }
    );
  }
);
