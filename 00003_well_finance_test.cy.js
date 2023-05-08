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
   cy.request(
      "POST",
      "/app_builder/model/7ecd7257-1023-4917-bc3f-88061293cf30",
      {
         Name: "Test",
         Services: [{ uuid: "9ba7674a-c25e-4d16-8cb4-4f930a4fc208" }],
      }
   );
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
         '[data-cy="tab-Cases-1fea5a32-def5-4f1a-b10d-8f885b3e602f-c1d91228-74f5-4497-b12b-6c84c59ed26c"]'
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
      cy.get(
         '[data-cy="number Length Hours e1ea09ec-cd12-4b70-9846-970ddc906229 5a5c92ce-1f06-465c-9fe5-8477db393a40"]'
      )
         .should("exist")
         .and("have.value", 1);
      cy.get('[data-cy="button save 5a5c92ce-1f06-465c-9fe5-8477db393a40"]')
         .should("exist")
         .click();

      cy.get(
         '[data-cy="connectObject Clients Present 86f2c10c-b435-4759-9f25-c33820df7b0e 2dca1324-8317-4593-9c22-21d237bf7624"]'
      )
         .should("exist")
         .should("contain", "Tim Green");
      cy.get('[data-cy="button save 2dca1324-8317-4593-9c22-21d237bf7624"]')
         .should("exist")
         .click();
      cy.get(
         '[data-cy="list Problems b73a3032-3e16-418e-b4aa-ef97620a6f4c 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true });
      cy.get(
         '[data-cy="list options Addiction b73a3032-3e16-418e-b4aa-ef97620a6f4c 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click();
      cy.get(
         '[data-cy="list Suicidal Thoughts 98bb07b9-7710-46a6-b83c-cfd118df68fe 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true });
      cy.get('div[webix_l_id="Discussed but Nothing of Concern"]')
         .scrollIntoView()
         .should("exist")
         .click();
      cy.get(
         '[data-cy="list Sleep 29cab146-bfed-4353-8dd5-5d7a0f526d01 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true });
      cy.get('div[webix_l_id="Interrupted Sleep"]').should("exist").click();
      cy.get(
         '[data-cy="list Behavior ee36a93c-f295-45d2-a9fb-bb00d611f5f6 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true });
      cy.get('div[webix_l_id="Tense"]')
         .scrollIntoView()
         .should("exist")
         .click();
      cy.get(
         '[data-cy="list Focus of Session 8c0e93d5-33a4-49a5-b01a-f69f2ff85f42 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true });
      cy.get('div[webix_l_id="Identifying Exceptions"]')
         .should("exist")
         .click();
      cy.get(
         '[data-cy="LongText GoalsObjectivesHopes 9d56d6d0-ffa6-423c-858e-4f9d9806cd4d 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true })
         .type("Good Development");
      cy.get(
         '[data-cy="LongText Session Content 562b5b58-1b10-49cd-aa88-3a4a50ed5509 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true })
         .type("First Session");
      cy.get(
         '[data-cy="LongText Takeaways Plans and Tasks Assigned 4798f781-7377-47d8-a739-cfe01bf11566 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true })
         .type("Getting Early Sleep");
      cy.get(
         '[data-cy="string Signature 9359335e-a311-4503-86f1-2ebe2d9f8b0f 09588053-0bb4-4d78-bbff-82da3cda98a3"]'
      )
         .should("exist")
         .click({ force: true })
         .type("Antman");
      cy.get('[data-cy="button save 09588053-0bb4-4d78-bbff-82da3cda98a3"]')
         .should("exist")
         .click({ force: true });
      cy.get(
         "[data-cy=tab-Finances-d78bc3e3-2d73-4a3c-aed1-106f387e551d-c1d91228-74f5-4497-b12b-6c84c59ed26c]"
      )
         .should("be.visible")
         .click();
      cy.get('[column="1"] > [aria-rowindex="1"]')
         .filter(":visible")
         .should("contain", "Test")
         .click();
      cy.get(
         "[data-cy=ABViewGrid_3a48f145-f333-45dd-b8a9-f3662d192db9_datatable]"
      )
         .should("exist")
         .and("contain", "1800")
         .and("not.contain", "3000");
   });
});
