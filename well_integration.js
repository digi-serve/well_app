const Common = require("../../../../setup/common.js");
const path = require("path");

const folderName = __dirname.match(/[^\\\/]+$/);

before(() => {
  Common.ResetDB(cy);
  Common.AuthLogin(cy);
  cy.request("POST", "/test/import", {
    file: `imports/${folderName}/clientDatabase.json`,
  });
});

beforeEach(() => {
  Common.AuthLogin(cy);
  Common.RunSQL(cy, folderName, ["reset_tables.sql"]);
});

it("Smoke Test", () => {
  describe("App Loads", () => {
    cy.visit("/").wait(1500);
    cy.get('[data-cy="portal_work_menu_sidebar"]').click();
    cy.get("[data-cy='05cde3ed-fd38-4e4c-b9a6-dfba9c979bdf']").should("exist");
  });
});
