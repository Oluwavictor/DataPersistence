const fs = require('fs');

const FIRST_NAMES = {
  male: [
    "John", "Michael", "William", "James", "Robert", "David", "Joseph", "Charles",
    "Thomas", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul",
    "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald",
    "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric",
    "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel",
    "Frank", "Gregory", "Raymond", "Alexander", "Patrick", "Jack", "Dennis", "Jerry",
    "Tyler", "Aaron", "Henry", "Douglas", "Peter", "Adam", "Nathan", "Zachary",
    "Walter", "Kyle", "Harold", "Carl", "Jeremy", "Keith", "Roger", "Gerald",
    "Ethan", "Arthur", "Terry", "Lawrence", "Sean", "Christian", "Albert", "Joe",
    "Mohammed", "Ahmed", "Ibrahim", "Hassan", "Ali", "Yusuf", "Omar", "Tunde",
    "Chinedu", "Olumide", "Femi", "Segun", "Bayo", "Kwame", "Kofi", "Amadou"
  ],
  female: [
    "Mary", "Patricia", "Linda", "Barbara", "Elizabeth", "Jennifer", "Maria", "Susan",
    "Margaret", "Dorothy", "Lisa", "Nancy", "Karen", "Betty", "Helen", "Sandra",
    "Donna", "Carol", "Ruth", "Sharon", "Michelle", "Laura", "Sarah", "Kimberly",
    "Deborah", "Jessica", "Shirley", "Cynthia", "Angela", "Melissa", "Brenda", "Amy",
    "Anna", "Rebecca", "Virginia", "Kathleen", "Pamela", "Martha", "Debra", "Amanda",
    "Stephanie", "Carolyn", "Christine", "Marie", "Janet", "Catherine", "Frances", "Ann",
    "Joyce", "Diane", "Alice", "Julie", "Heather", "Teresa", "Doris", "Gloria",
    "Evelyn", "Jean", "Cheryl", "Mildred", "Katherine", "Joan", "Ashley", "Judith",
    "Rose", "Janice", "Kelly", "Nicole", "Judy", "Christina", "Kathy", "Theresa",
    "Beverly", "Denise", "Tammy", "Irene", "Jane", "Lori", "Rachel", "Marilyn",
    "Aisha", "Fatima", "Khadija", "Zainab", "Hauwa", "Amaka", "Chioma", "Ngozi",
    "Folake", "Bukola", "Yetunde", "Adaeze", "Nneka", "Asha", "Akua", "Efua"
  ]
};

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
  "Adeyemi", "Okonkwo", "Adebayo", "Eze", "Nwosu", "Mensah", "Diallo", "Traore",
  "Kone", "Boateng", "Asante", "Owusu", "Mwangi", "Otieno", "Tshuma", "Ndebele",
  "Khan", "Patel", "Singh", "Kumar", "Sharma", "Ali", "Hussain", "Rahman"
];

const COUNTRIES = [
  { id: "US", name: "United States" },
  { id: "GB", name: "United Kingdom" },
  { id: "NG", name: "Nigeria" },
  { id: "ZA", name: "South Africa" },
  { id: "KE", name: "Kenya" },
  { id: "GH", name: "Ghana" },
  { id: "EG", name: "Egypt" },
  { id: "DE", name: "Germany" },
  { id: "FR", name: "France" },
  { id: "IT", name: "Italy" },
  { id: "ES", name: "Spain" },
  { id: "BR", name: "Brazil" },
  { id: "MX", name: "Mexico" },
  { id: "AR", name: "Argentina" },
  { id: "JP", name: "Japan" },
  { id: "CN", name: "China" },
  { id: "IN", name: "India" },
  { id: "PK", name: "Pakistan" },
  { id: "AU", name: "Australia" },
  { id: "CA", name: "Canada" }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge() {
  return Math.floor(Math.random() * 80) + 5;
}

function generateValidRow() {
  const gender = Math.random() > 0.5 ? "male" : "female";
  const firstName = randomChoice(FIRST_NAMES[gender]);
  const lastName = randomChoice(LAST_NAMES);
  const country = randomChoice(COUNTRIES);
  const age = randomAge();
  return `${firstName} ${lastName},${gender},${age},${country.id},${country.name}`;
}

function generateInvalidRow(type) {
  const country = randomChoice(COUNTRIES);
  const lastName = randomChoice(LAST_NAMES);

  switch (type) {
    case "missing_name":
      return `,male,30,${country.id},${country.name}`;
    case "missing_gender":
      return `Missing Gender ${lastName},,30,${country.id},${country.name}`;
    case "missing_age":
      return `Missing Age ${lastName},male,,${country.id},${country.name}`;
    case "negative_age":
      return `Negative Age ${lastName},female,-5,${country.id},${country.name}`;
    case "invalid_age":
      return `Invalid Age ${lastName},male,abc,${country.id},${country.name}`;
    case "invalid_gender":
      return `Invalid Gender ${lastName},unknown,25,${country.id},${country.name}`;
    case "extreme_age":
      return `Extreme Age ${lastName},female,200,${country.id},${country.name}`;
    case "all_blank":
      return `,,,,`;
    default:
      return generateValidRow();
  }
}

const NUM_VALID_ROWS = 950;
const NUM_INVALID_ROWS = 50;
const NUM_DUPLICATE_ROWS = 30;

let csv = "name,gender,age,country_id,country_name\n";
const usedNames = new Set();

console.log(`Generating ${NUM_VALID_ROWS} valid rows...`);
for (let i = 0; i < NUM_VALID_ROWS; i++) {
  let row;
  let name;
  let attempts = 0;
  do {
    row = generateValidRow();
    name = row.split(",")[0].toLowerCase().trim();
    attempts++;
  } while (usedNames.has(name) && attempts < 10);

  usedNames.add(name);
  csv += row + "\n";
}

console.log(`Adding ${NUM_DUPLICATE_ROWS} duplicate rows...`);
const namesArray = Array.from(usedNames);
for (let i = 0; i < NUM_DUPLICATE_ROWS; i++) {
  const dupName = randomChoice(namesArray);
  const country = randomChoice(COUNTRIES);
  csv += `${dupName},male,30,${country.id},${country.name}\n`;
}

console.log(`Adding ${NUM_INVALID_ROWS} invalid rows...`);
const invalidTypes = [
  "missing_name", "missing_gender", "missing_age",
  "negative_age", "invalid_age", "invalid_gender",
  "extreme_age", "all_blank"
];
for (let i = 0; i < NUM_INVALID_ROWS; i++) {
  csv += generateInvalidRow(randomChoice(invalidTypes)) + "\n";
}

const total = NUM_VALID_ROWS + NUM_DUPLICATE_ROWS + NUM_INVALID_ROWS;
fs.writeFileSync("test_bulk.csv", csv);

console.log("");
console.log("✅ Generated test_bulk.csv");
console.log(`   Total rows : ${total}`);
console.log(`   Valid      : ${NUM_VALID_ROWS}`);
console.log(`   Duplicates : ${NUM_DUPLICATE_ROWS}`);
console.log(`   Invalid    : ${NUM_INVALID_ROWS}`);
