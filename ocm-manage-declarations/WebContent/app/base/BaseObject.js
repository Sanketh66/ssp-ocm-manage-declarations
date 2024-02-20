sap.ui.define(["sap/ui/base/Object"], function(Object) {
  "use strict";

  /**
   * Base object from which all other utility singletons inherit
   * @exports com/ssp/ocm/manage/declarations/app/base/BaseObject
   */
  return Object.extend("com.ssp.ocm.manage.declarations.app.base.BaseObject", {
    /**
     * Return a reference to the owner component
     *
     * @return {sap.ui.core.Component} Owner component
     * @public
     */
    getOwnerComponent: function() {
      return this._oOwnerComponent;
    },

    /**
     * Register owner component to the created object
     *
     * @param  {sap.ui.core.Component} oOwnerComponent Owner component for current object
     * @return {sap.ui.core.Component} Builder pattern, return that it was set
     * @public
     */
    setOwnerComponent: function(oOwnerComponent) {
      this._oOwnerComponent = oOwnerComponent;
    },

    /**
     * Return a reference to the event bus
     *
     * @return {sap.ui.core.EventBus} Owner component
     * @public
     */
    getEventBus: function() {
      return this._oEventBus;
    },

    /**
     * Register event bus to the created object
     *
     * @param  {sap.ui.core.Component} oEventBus Event bus associatted
     * @return {sap.ui.core.Component} Builder pattern, return that it was set
     * @public
     */
    setEventBus: function(oEventBus) {
      this._oEventBus = oEventBus;
    }
  });
});
