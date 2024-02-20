sap.ui.require(["com/ssp/ocm/manage/declarations/app/utils/formatter"], function(
  formatter
) {
  "use strict";
  QUnit.module("formatter - Format Days");

  function formatDaysTestCase(oOptions) {
    // Act
    var sState = formatter.formatDays(oOptions.days);
    // Assert
    oOptions.assert.strictEqual(
      sState,
      oOptions.expected,
      "The days state was correct"
    );
  }
  QUnit.test("Should format days lower or equal than 200 to None", function(
    assert
  ) {
    formatDaysTestCase.call(this, {
      assert: assert,
      days: 0,
      expected: "None"
    });

    formatDaysTestCase.call(this, {
      assert: assert,
      days: 42,
      expected: "None"
    });

    formatDaysTestCase.call(this, {
      assert: assert,
      days: 200,
      expected: "None"
    });
  });

  QUnit.test(
    "Should format days higher than 200 and lower than 301 to Warning",
    function(assert) {
      formatDaysTestCase.call(this, {
        assert: assert,
        days: 201,
        expected: "Warning"
      });

      formatDaysTestCase.call(this, {
        assert: assert,
        days: 262,
        expected: "Warning"
      });

      formatDaysTestCase.call(this, {
        assert: assert,
        days: 300,
        expected: "Warning"
      });
    }
  );

  QUnit.test("Should format days higher or equal than 301 to error", function(
    assert
  ) {
    formatDaysTestCase.call(this, {
      assert: assert,
      days: 301,
      expected: "Error"
    });

    formatDaysTestCase.call(this, {
      assert: assert,
      days: 360,
      expected: "Error"
    });
  });

  QUnit.module("formatter - Format Status");

  function formatStatusTestCase(oOptions) {
    // Act
    var sColor = formatter.formatStatus(oOptions.status);
    // Assert
    oOptions.assert.strictEqual(
      sColor,
      oOptions.expected,
      "The color was correct"
    );
  }

  // QUnit.test("Should format red if the status is OFD", function(assert) {
  //   formatStatusTestCase.call(this, {
  //     assert: assert,
  //     status: "OFD",
  //     expected: "#d90000"
  //   });
  // });

  // QUnit.test("Should format green if the status is DIS", function(assert) {
  //   formatStatusTestCase.call(this, {
  //     assert: assert,
  //     status: "DIS",
  //     expected: "#0bb233"
  //   });
  // });

  // QUnit.test("Should format yellow if the status is REI", function(assert) {
  //   formatStatusTestCase.call(this, {
  //     assert: assert,
  //     status: "REI",
  //     expected: "#ffc900"
  //   });
  // });
});
