export const SERVICE_OPTIONS_BY_PORTAL = {
  user: ["Incident"],
  staff: ["Incident", "Service Request", "Change Request"],
};

export const SERVICE_PREFIXES = {
  Incident: "SR",
  "Service Request": "SR",
  "Change Request": "CR",
};

export const CATEGORY_OPTIONS = ["SAP Application", "Hardware", "Network"];

export const SUB_CATEGORIES_BY_CATEGORY = {
  "SAP Application": [
    "FI",
    "CO",
    "SD",
    "MM",
    "PP",
    "ABAP",
    "BASIS",
    "MDM",
    "CTM",
  ],
  Hardware: ["Desktop", "Laptop", "Printer"],
  Network: ["Internet", "SAP Not Working"],
};

export const STAFF_ASSIGNMENTS = [
  // ── SAP Application > FI ────────────────────────────────────────────────
  { category: "SAP Application", sub_category: "FI", name: "Subodh Kumar",    email: "Subodh.Kumar@viraj.com" },
  { category: "SAP Application", sub_category: "FI", name: "Saurabh Kulkarni", email: "Saurabh.Kulkarni@viraj.com" },
  // ── SAP Application > CO ────────────────────────────────────────────────
  { category: "SAP Application", sub_category: "CO", name: "Subodh Kumar",    email: "Subodh.Kumar@viraj.com" },
  { category: "SAP Application", sub_category: "CO", name: "Saurabh Kulkarni", email: "Saurabh.Kulkarni@viraj.com" },
  // ── SAP Application > SD ────────────────────────────────────────────────
  { category: "SAP Application", sub_category: "SD", name: "Rupesh Pawade",   email: "rupesh.pawade@viraj.com" },
  // ── SAP Application > MM ────────────────────────────────────────────────
  { category: "SAP Application", sub_category: "MM", name: "Sharad Desai",    email: "sharad.desai@viraj.com" },
  { category: "SAP Application", sub_category: "MM", name: "Saurabh Kulkarni", email: "Saurabh.Kulkarni@viraj.com" },
  // ── SAP Application > PP ────────────────────────────────────────────────
  { category: "SAP Application", sub_category: "PP", name: "Jayesh Meher",    email: "Jayesh.Meher@viraj.com" },
  // ── SAP Application > ABAP ──────────────────────────────────────────────
  { category: "SAP Application", sub_category: "ABAP", name: "Sanjay Garhpandey", email: "Sanjay.Garhpandey@viraj.com" },
  { category: "SAP Application", sub_category: "ABAP", name: "Sanjay Dash",   email: "Sanjay.Dash@viraj.com" },
  // ── SAP Application > BASIS ─────────────────────────────────────────────
  { category: "SAP Application", sub_category: "BASIS", name: "Harshad Bari", email: "Harshad.Bari@viraj.com" },
  // ── SAP Application > MDM ───────────────────────────────────────────────
  { category: "SAP Application", sub_category: "MDM", name: "Komal Kalgamwala", email: "sap.mm@viraj.com" },
  { category: "SAP Application", sub_category: "MDM", name: "Sharad Desai",   email: "sharad.desai@viraj.com" },
  { category: "SAP Application", sub_category: "MDM", name: "Saurabh Kulkarni", email: "Saurabh.Kulkarni@viraj.com" },
  { category: "SAP Application", sub_category: "MDM", name: "Rupesh Pawade",  email: "rupesh.pawade@viraj.com" },
  // ── Hardware > Desktop ──────────────────────────────────────────────────
  { category: "Hardware", sub_category: "Desktop", name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { category: "Hardware", sub_category: "Desktop", name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
  // ── Hardware > Laptop ───────────────────────────────────────────────────
  { category: "Hardware", sub_category: "Laptop", name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { category: "Hardware", sub_category: "Laptop", name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
  // ── Hardware > Printer ──────────────────────────────────────────────────
  { category: "Hardware", sub_category: "Printer", name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { category: "Hardware", sub_category: "Printer", name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { category: "Hardware", sub_category: "Printer", name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
  // ── Network > Internet ──────────────────────────────────────────────────
  { category: "Network", sub_category: "Internet", name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { category: "Network", sub_category: "Internet", name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { category: "Network", sub_category: "Internet", name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
  // ── Network > SAP Not Working ───────────────────────────────────────────
  { category: "Network", sub_category: "SAP Not Working", name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { category: "Network", sub_category: "SAP Not Working", name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
];

export const CTM_PLANT_ASSIGNMENTS = [
  { plant_code: "1000", plant_name: "Scrapyard", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1001", plant_name: "SMS1", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1002", plant_name: "SMS2", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1003", plant_name: "WRM", staff_name: "Yogesh Gaikwad", staff_email: "Yogesh.Gaikwad@viraj.com" },
  { plant_code: "1004", plant_name: "BRIGHT BAR HEX AND SQUARE", staff_name: "Abhijeet Nalawade", staff_email: "Sap.Pp@viraj.com" },
  { plant_code: "1005", plant_name: "AP", staff_name: "Yogesh Gaikwad", staff_email: "Yogesh.Gaikwad@viraj.com" },
  { plant_code: "1006", plant_name: "RMD-G2", staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1007", plant_name: "Wire", staff_name: "Mohan Patel", staff_email: "Mohan.Patel@viraj.com" },
  { plant_code: "1008", plant_name: "Flange", staff_name: "Yogendrasingh Rathore", staff_email: "Yogendrasingh.Rathore@viraj.com" },
  { plant_code: "1009", plant_name: "Press", staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1010", plant_name: 'Old Mill 10"', staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1011", plant_name: 'RMD 28" Inch', staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1012", plant_name: "SRM Rolling Mill", staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1013", plant_name: "Profile Process", staff_name: "Sachin bansode", staff_email: "sachin.bansode@viraj.com" },
  { plant_code: "1014", plant_name: "Bright Bar", staff_name: "Krishna Kasvekar", staff_email: "Krishna.Kasvekar@viraj.com" },
  { plant_code: "1015", plant_name: "Fasteners", staff_name: "Santosh Dhawade", staff_email: "Santosh.Dhawade@viraj.com" },
  { plant_code: "1016", plant_name: "SAF Mill Scale – 4 Acre", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1017", plant_name: "Slug Crusher – 25 Acre", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1018", plant_name: "Sludge Drying Plant", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1019", plant_name: "Zurik Scrap", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1021", plant_name: "SS Seamless Pipe Plant", staff_name: "Sachin Bansode", staff_email: "sachin.bansode@viraj.com" },
  { plant_code: "1023", plant_name: '18"B MILL', staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1024", plant_name: '13"B MILL', staff_name: "Abhijit Yashwantrao", staff_email: "Abhijit.Yashwantrao@viraj.com" },
  { plant_code: "1026", plant_name: "Ferro Molly Plant", staff_name: "Akhilesh Shukla", staff_email: "Akhilesh.Sukla@viraj.com" },
  { plant_code: "1027", plant_name: "Seamless Pilger Plant", staff_name: "Sachin Bansode", staff_email: "sachin.bansode@viraj.com" },
  { plant_code: "1100", plant_name: "Mumbai Corporate", staff_name: null, staff_email: null },
  { plant_code: "1101", plant_name: "Delhi Corporate", staff_name: null, staff_email: null },
  { plant_code: "1102", plant_name: "Canteen", staff_name: null, staff_email: null },
  { plant_code: "1103", plant_name: "Bellagio", staff_name: null, staff_email: null },
  { plant_code: "1104", plant_name: "70 Bungalow", staff_name: null, staff_email: null },
  { plant_code: "1106", plant_name: "Tarapur Corporate", staff_name: null, staff_email: null },
];

export const VIRAJ_STAFF_DEFAULT_PASSWORD = "Viraj@123";
export const VIRAJ_HELPDESK_SHARED_EMAIL = "Helpdesk@viraj.com";
export const VIRAJ_HELPDESK_SHARED_LOGIN_NAME = "Helpdesk Team";
export const VIRAJ_HELPDESK_MEMBER_ROWS = [
  { name: "Bipin Jadhav",     email: "Bipin.Jadhav@viraj.com" },
  { name: "Jay Bari",         email: "jay.bari@viraj.com" },
  { name: "Ajay Dhodi",       email: "ajay.dhodi@viraj.com" },
  { name: "Mahesh Rahubansi", email: "mahesh.rahubansi@viraj.com" },
  { name: "Aaquib Raje",      email: "aaquib.raje@viraj.com" },
  { name: "Amol Chaudhari",   email: "a.chaudhari@viraj.com" },
  { name: "Vikas Tandel",     email: "Vikas.Tandel@viraj.com" },
  { name: "Yogesh Ule",       email: "y.ule@vaishnoyard.com" },
  { name: "Kapil Sankhe",     email: "kapil.sankhe@viraj.com" },
  { name: "Roshan Cerejo",    email: "Roshan.Cerejo@viraj.com" },
  { name: "Amol Chaugule",    email: "Amol.Chaugule@viraj.com" },
];

export const VIRAJ_HELPDESK_ALIAS_NAMES = VIRAJ_HELPDESK_MEMBER_ROWS.map((person) => person.name);

export function getServiceOptions(portal) {
  return SERVICE_OPTIONS_BY_PORTAL[portal] || SERVICE_OPTIONS_BY_PORTAL.user;
}

export function getSubCategoryOptions(category) {
  return SUB_CATEGORIES_BY_CATEGORY[category] || [];
}

export function getAssignableStaff({ category, subCategory, plant }) {
  if (!category || !subCategory) return [];

  if (category === "SAP Application" && subCategory === "CTM") {
    const selectedPlant = String(plant || "");
    const plantAssignment = CTM_PLANT_ASSIGNMENTS.find((item) => item.plant_code === selectedPlant);
    if (!plantAssignment?.staff_name) return [];
    return [plantAssignment];
  }

  return STAFF_ASSIGNMENTS.filter(
    (assignment) => assignment.category === category && assignment.sub_category === subCategory
  );
}

export function getCtmAssignmentForPlant(plant) {
  return CTM_PLANT_ASSIGNMENTS.find((item) => item.plant_code === String(plant || ""));
}
