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

describe("Intakes", () => {
   beforeEach(() => {
      // Open the intakes tab
      cy.get(
         '[data-cy="tab-Intakes-583414ac-5d12-4828-89b8-202a520c0c6a-c1d91228-74f5-4497-b12b-6c84c59ed26c"]'
      )
         .should("exist")
         .click();
   });
   it("Can see intakes in grid", () => {
      // Check the grid has data
      cy.get(
         '[data-cy="ABViewGrid_89e6d4f1-9be5-4112-808f-89e67fa92c1c_datatable"]'
      )
         .should("exist")
         .find('[role="gridcell"]')
         .should("exist");
   });
   describe("Intakes Detail", () => {
      beforeEach(() => {
         cy.get(
            '[data-cy="ABViewGrid_89e6d4f1-9be5-4112-808f-89e67fa92c1c_datatable"]'
         )
            .should("exist")
            .get("div.detailsView")
            // .should(($div) => {
            //    expect(Cypress.dom.isAttached($div)).to.be.true;
            // })
            .click({ force: true });
      });
      it("Shows Intake Details", () => {
         cy.get(
            '[data-cy="Detail Intake Detail 02386b90-6da2-4371-aa67-e7dd740b216a"]'
         )
            .should("exist")
            .and("contain", "Tim Green")
            .and("contain", "Jill Green")
            .and("contain", "Any Provider")
            .and("contain", "Counseling");
      });
      it("Shows Client Details", () => {
         cy.get(
            '[data-cy="ABViewGrid_7f5a66b7-7c0a-4242-9c40-603b0f878519_datatable"]'
         )
            .should("exist")
            .and("contain", "Tim Green")
            .and("contain", "Jill Green");
         cy.get(
            '[data-cy="Detail Clients 9ce60a45-a4de-4fb9-8549-862fa35bcc0c"]'
         )
            .should("exist")
            .and("contain", "Tim Green")
            .and("contain", "email@email.com")
            .and("contain", "998887")
            .and("contain", "Career Choices, Difficult Experiences");
      });
      it.skip("Adds a case", () => {
         cy.get(
            '[data-cy="tab Process Intake 9eba4e9f-d3e0-499f-997d-a3c108c7a901 9ebc6888-3cbf-4450-ac1a-d51808843884"]'
         )
            .should("exist")
            .click();
         cy.get(
            '[data-cy="menu-item Add Case 33cf6b2d-764a-43b5-898b-9c9522ad6da4 a820cb6d-12be-40ca-bf43-9ec04d01d4e1"]'
         )
            .should("exist")
            .click();
         cy.get(
            '[data-cy="list Service f198c77b-f05f-4b45-8e6a-14a20c9a8b43 7566e309-648e-48de-b347-be0508f4662f"]'
         ).click();
         cy.get('[webix_l_id="Counselling"]').click();
      });
   });
});
