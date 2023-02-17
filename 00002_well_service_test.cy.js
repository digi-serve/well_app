const Common = require("../../../../setup/common.js");

const folderName = __dirname.match(/[^\\/]+$/);

Cypress.on("uncaught:exception", (err) => {
   if (
      err.message.includes(
         "TypeError: Cannot read properties of undefined (reading 'raw')"
      )
   ) {
      return false;
   }
});

before(() => {
   Common.ResetDB(cy);
   Common.AuthLogin(cy);
   cy.request("POST", "/test/import", {
      file: `imports/${folderName}/appbuilder_app.json`,
   });
});

beforeEach(() => {
   Common.AuthLogin(cy);
   Common.RunSQL(cy, folderName, ["reset_tables.sql", "insert_data.sql"]);
   // Open the App
   cy.visit("/");
   cy.get('[data-cy="portal_work_menu_sidebar"]').should("exist").click();
   cy.get("[data-cy='05cde3ed-fd38-4e4c-b9a6-dfba9c979bdf']")
      .should("exist")
      .click();
});

describe("Services", () => {
   beforeEach(() => {
      // Open the Services tab
      cy.get(
         '[data-cy="tab-Services-1fea5a32-def5-4f1a-b10d-8f885b3e602f-c1d91228-74f5-4497-b12b-6c84c59ed26c"]'
      )
         .should("exist")
         .click();
   });
   it("Add a Session", () => {
      // Open Add Session Form
      cy.get(
         '[data-cy="menu-item Add Session 89b51c90-467f-4801-b890-4c9c4555929a b60c0426-bcd4-4b5f-93cf-5627aeb026d4"]'
      )
         .should("exist")
         .click();
      //Save with the default settings
      cy.get('[data-cy="button save 5a5c92ce-1f06-465c-9fe5-8477db393a40"]')
         .should("exist")
         .click();
      //Expect the client and provider to be set by a record rule.
      cy.get(
         '[data-cy="connectObject Providers f0d6ede7-a616-435f-a1f6-b65d1ba0df53 2dca1324-8317-4593-9c22-21d237bf7624"]'
      )
         .should("contain", "Peter Parker")
         .and("not.contain", "Steven Strange");
      cy.get(
         '[data-cy="connectObject Clients Present 86f2c10c-b435-4759-9f25-c33820df7b0e 2dca1324-8317-4593-9c22-21d237bf7624"]'
      ).contains("Tim Green");
   });
});
