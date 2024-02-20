sap.ui.require(["com/ssp/ocm/manage/declarations/app/base/BaseObject"], function(
  BaseObject
) {
  "use strict";
  QUnit.module("BaseObject - Owner Component tests", {
    beforeEach: function() {
      this.baseObject = new BaseObject();
    },
    afterEach: function() {
      this.baseObject.destroy();
    }
  });

  QUnit.test(
    "The component obtained by the getter should be the same that is set by the setter",
    function(assert) {
      var component = {
        property: "value"
      };

      this.baseObject.setOwnerComponent(component);

      assert.equal(
        this.baseObject.getOwnerComponent(),
        component,
        "The component was set correctly"
      );
    }
  );

  QUnit.module("BaseObject - Event bus tests", {
    beforeEach: function() {
      this.baseObject = new BaseObject();
    },
    afterEach: function() {
      this.baseObject.destroy();
    }
  });

  QUnit.test(
    "The event bus obtained by the getter should be the same that is set by the setter",
    function(assert) {
      var eventBus = {
        property: "value"
      };

      this.baseObject.setEventBus(eventBus);

      assert.equal(
        this.baseObject.getEventBus(),
        eventBus,
        "The event bus was set correctly"
      );
    }
  );
});
