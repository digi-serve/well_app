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

describe.only("Adding Payments", () => {
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
   });

   it("Can Adding Payments", () => {
      cy.get(
         '[data-cy="tab-Finances-d78bc3e3-2d73-4a3c-aed1-106f387e551d-c1d91228-74f5-4497-b12b-6c84c59ed26c"]'
      )
         .should("exist")
         .click();
      const today = new Date();
      // Open the Finances tab
      const date =
         today.getDate().toString().padStart(2, "0") +
         "/" +
         (today.getMonth() + 1).toString().padStart(2, "0") +
         "/" +
         today.getFullYear();
      cy.get(
         '[data-cy="tab-Payments-81c1f567-ba56-4be8-b825-a765bfee6d7b-6c4fa615-3eec-476c-b2e0-0cb8ded14215"]'
      )
         .should("exist")
         .click();
      cy.get(
         '[data-cy="menu-item Add Payment ae120f51-b322-4fa4-916e-4059d31169e5 933765d4-e2fd-48a2-bcb8-875c3a95c453"]'
      )
         .should("exist")
         .click();
      cy.get(
         '[data-cy="date Date bca053b6-bdae-4e00-ad4d-89f51397056e 9389d183-c317-46db-9861-f05f62ebee79"]'
      )
         .click()
         .type(date);
      cy.get(
         '[data-cy="number Amount efee196c-ac82-4851-88dd-715fa60adcbf 9389d183-c317-46db-9861-f05f62ebee79"]'
      )
         .click()
         .type("4500");
      cy.get(
         '[data-cy="list Method f493b8af-1e74-4df5-9f6b-1fbda6a20e00 9389d183-c317-46db-9861-f05f62ebee79"]'
      ).click();
      cy.get('div[webix_l_id="Cash"]').click();
      cy.get(
         '[data-cy="string Description a68a58a9-c178-4c69-a279-cf3eeaf76bad 9389d183-c317-46db-9861-f05f62ebee79"]'
      )
         .click()
         .type("Test Payments");
      cy.get(
         '[data-cy="button save 9389d183-c317-46db-9861-f05f62ebee79"]'
      ).click();
      cy.get(
         'div[class="webix_view webix_control webix_el_button webix_primary webix_warn"]'
      )
         .find("button")
         .should("have.attr", "class", "webix_button")
         .click();
      cy.get("div.detailsView")
         .find("span")
         .should("have.attr", "class", "webix_icon fa fa-eye")
         .click({ force: true });
      cy.get('div[view_id*="ABViewText_cdd435ac"]')
         .find("a")
         .should("have.text", "Open Receipt")
         .click();
   });
});
