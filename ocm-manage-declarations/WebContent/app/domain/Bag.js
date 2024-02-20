sap.ui.define(
  [
    "sap/ui/base/Object"
  ],
  function(Object) {
    "use strict";

    // A bag has a list of DeclarationItem(s) under .items
    return Object.extend("com.ssp.ocm.manage.declarations.app.domain.Bag", {
      constructor: function(sBagNumber) {
        this.bagNumber = sBagNumber;
        this.items = [];
      },

      // setItems: function(aPseudoItems) {
      //   var that = this;
      //   // convert the pseudo items to proper DeclarationItem
      //   aPseudoItems.forEach(function(i) {
      //     var oItem = new DeclarationItem(i);
      //     oItem.bagged = true;
      //     that.items.push(oItem);
      //   });
      //   return this;
      // }

      setItems: function(aItems) {
        this.items = aItems.concat();
        this.items.forEach(
          function(i) {
            i.bagged = true;
            i.bagNumber = this.bagNumber;
          }.bind(this)
        );
        return this;
      },

      pushItems: function(aDeclarationItems) {
        this.items = this.items.concat(aDeclarationItems);
      },

      removeItem: function(itemIndex) {
        this.items.splice(itemIndex, 1);
      },

      /**
       * Returns array of items converted to the backend format.
       * @returns {Array} items in backend format.
       */
      toBackendItems: function() {
        return this.items.map(function(i) {
          return i.toBackend();
        });
      },

      /**
       * Removes all the items from the bag that have a zero or empty amount
       * @returns {void} Changes the bag's items.
       */
      removeZeroItems: function() {
        var aItems = this.items || [];
        aItems = aItems.filter(function(i) {
          return i.isNonZero();
        });
        this.items = aItems;
      },

      /**
       * Removes all the items from the bag that have a blank amount
       * @returns {void} Changes the bag's items.
       */
      removeBlankItems: function() {
        var aItems = this.items || [];
        aItems = aItems.filter(function(i) {
          return i.isNonBlank();
        });
        this.items = aItems;
      }
      
    });
  }
);
