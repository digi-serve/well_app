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
      file: `imports/${folderName}/clientDatabase.json`,
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
   it("Calculates Charges", () => {
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
      cy.get('[data-cy="button save 2dca1324-8317-4593-9c22-21d237bf7624"]')
         .should("exist")
         .click();
      cy.get(
         '[data-cy="tab Charges ed59c5c7-e251-4d05-a023-71db7cefe02b 7e20b83f-dfdc-4afd-8bdf-fba264fd7bdc"]'
      )
         .should("exist")
         .click();
      cy.get(
         '[data-cy="ABViewGrid_26fdbb4e-32b9-4d2e-9f77-d5308fa05ad7_datatable"]'
      )
         .should("exist")
         .contains("1600");
   });
});
