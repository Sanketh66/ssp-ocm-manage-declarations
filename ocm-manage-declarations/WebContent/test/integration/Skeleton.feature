Feature: Skeleton App Feature
    This is a simple integration test with Gherkin

  Background:
    Given I start my app

  Scenario: See a simple text
    When I look at the screen
    Then I can see the text "Skeleton" on the page

  Scenario: See data after entering a serial number
    When I enter the Serial Number "XSS-001" in the input
    And I press the Show button
    Then I can see the product data dialog
    And the dialog has the title "Product data"
    And the dialog has the product data

  # This shows that steps can (and should if possible) be reused
  Scenario: Close the dialog
    Given I enter the Serial Number "XSS-211" in the input
    And I press the Show button
    And I can see the product data dialog
    When I press the Close Button
    Then the dialog closes
