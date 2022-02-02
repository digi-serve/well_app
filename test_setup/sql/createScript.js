const data = {
   Client: [
      {
         uuid: "02a293e6-492a-4dca-8a84-4d81da450c23",
         Availability: "Jan 1",
         "Flexible Dates": "Yes",
         "Cross Cultural Relationship": "Somewhat",
         "Last Name": "Green",
         "Primary Language": "English",
         "Emergency Email": "sss@email.com",
         Newsletter: "No",
         "First Time": "No",
         "Concerns meeting together": "No",
         "Date Birth": "NOW()",
         "Emergency Phone": 11111,
         "Emergency Contact": "sss",
         Gender: "Male",
         Occupation: "IT",
         Phone: 998887,
         "Prescription Medication": "No",
         "Medical Issues": "No:",
         Email: "email@email.com",
         // Group: "72b0f1ec-bb3f-4f85-981a-19c5df366a2e",
         "Cross Cultural Service Years": 12,
         "Topics More Info": "Yes details",
         Topics: "Career Choices, Difficult Experiences",
         "Passport Country": "Cambodia",
         "First Name": "Tim",
      },
      {
         uuid: "d647e27d-cb0b-456a-83db-98a3e62eaf12",
         Availability: "Jan 1",
         "Flexible Dates": "Yes",
         "Cross Cultural Relationship": "Somewhat",
         "Last Name": "Green",
         "Primary Language": "English",
         "Emergency Email": "sss@email.com",
         Newsletter: "No",
         "First Time": "No",
         "Concerns meeting together": "No",
         "Date Birth": "NOW()",
         "Emergency Phone": 11111,
         "Emergency Contact": "sss",
         Gender: "Female",
         Occupation: "IT",
         Phone: 998887,
         "Prescription Medication": "No",
         "Medical Issues": "No:",
         Email: "email@email.com",
         // Group: "72b0f1ec-bb3f-4f85-981a-19c5df366a2e",
         "Cross Cultural Service Years": 12,
         "Topics More Info": "Yes details",
         Topics: "Career Choices, Difficult Experiences",
         "Passport Country": "Cambodia",
         "First Name": "Jill",
      },
   ],
   WellIntake: [
      {
         uuid: "b12ad108-1b47-452f-8500-fb3bfcd0359d",
         Timestamp: "NOW()",
         "Provider Request": "Any Provider",
         Service: "Counseling",
         Location: "Well - Chiang Mai",
         "Bill to": "Tim Green",
         Feedback: "None",
      },
   ],
   "JOINMN_Well-Intake_Client_Clients": [
      {
         uuid: false,
         id: 1,
         Client: "02a293e6-492a-4dca-8a84-4d81da450c23",
         "Well-Intake": "b12ad108-1b47-452f-8500-fb3bfcd0359d",
      },
      {
         uuid: false,
         id: 2,
         Client: "d647e27d-cb0b-456a-83db-98a3e62eaf12",
         "Well-Intake": "b12ad108-1b47-452f-8500-fb3bfcd0359d",
      },
   ],
};

function generateSQLInserts(data) {
   const output = [];
   for (const table in data) {
      output.push(`LOCK TABLES \`AB_${table}\` WRITE;`);
      data[table].forEach((record) => {
         const leftSide = ["`uuid`", "`created_at`", "`updated_at`"];
         const rightSide = ["UUID()", "NOW()", "NOW()"];
         for (const field in record) {
            if (field === "uuid") {
               if (!record.uuid) {
                  leftSide.shift();
                  rightSide.shift();
               } else {
                  rightSide[0] = `"${record[field]}"`;
               }
               continue;
            }
            leftSide.push(`\`${field}\``);
            let rightValue = `"${record[field]}"`;
            if (record[field] === "NOW()") {
               rightValue = "NOW()";
            }
            rightSide.push(rightValue);
         }
         const line = `INSERT INTO \`AB_${table}\` (${leftSide.join(
            ", "
         )}) VALUES (${rightSide.join(", ")});`;
         output.push(line);
      });
      output.push("UNLOCK TABLES;");
   }
   return output.join("\n");
}

// function generateConnectedRecords(data) {}

console.log(generateSQLInserts(data));
// console.log(generateConnectedRecords());
