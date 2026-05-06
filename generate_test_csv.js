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
    "Chinedu", "Olumide", "Femi", "Segun", "Bayo", "Kwame", "Kofi", "Amadou",
    "Abdul", "Karim", "Rashid", "Tariq", "Faisal", "Hamza", "Imran", "Khalid",
    "Salim", "Yasin", "Zain", "Adil", "Bilal", "Hadi", "Jamal", "Naeem"
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
    "Folake", "Bukola", "Yetunde", "Adaeze", "Nneka", "Asha", "Akua", "Efua",
    "Layla", "Mariam", "Noor", "Sara", "Yara", "Zara", "Dunia", "Hala",
    "Iman", "Jana", "Kenza", "Lina", "Nada", "Rania", "Salma", "Tala"
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
  "Khan", "Patel", "Singh", "Kumar", "Sharma", "Ali", "Hussain", "Rahman",
  "Cohen", "Levi", "Mizrahi", "Rosen", "Goldberg", "Friedman", "Klein", "Stern",
  "Park", "Kim", "Lee", "Choi", "Jung", "Kang", "Yoon", "Han",
  "Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Zhao", "Huang"
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
  { id: "CA", name: "Canada" },
  { id: "RU", name: "Russia" },
  { id: "TR", name: "Turkey" },
  { id: "SA", name: "Saudi Arabia" },
  { id: "ID", name: "Indonesia" },
  { id: "TH", name: "Thailand" }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge() {
  return Math.floor(Math.random() * 80) + 5;
}

function generateValidRow(uniqueId) {
  const gender = Math.random() > 0.5 ? "male" : "female";
  const firstName = randomChoice(FIRST_NAMES[gender]);
  const lastName = randomChoice(LAST_NAMES);
  const country = randomChoice(COUNTRIES);
  const age = randomAge();
  // Add unique ID to ensure uniqueness across 500k rows
  return `${firstName} ${lastName} ${uniqueId},${gender},${age},${country.id},${country.name}`;
}

function generateInvalidRow(type, uniqueId) {
  const country = randomChoice(COUNTRIES);

  switch (type) {
    case "missing_name":
      return `,male,30,${country.id},${country.name}`;
    case "missing_gender":
      return `Missing Gender ${uniqueId},,30,${country.id},${country.name}`;
    case "missing_age":
      return `Missing Age ${uniqueId},male,,${country.id},${country.name}`;
    case "negative_age":
      return `Negative Age ${uniqueId},female,-5,${country.id},${country.name}`;
    case "invalid_age":
      return `Invalid Age ${uniqueId},male,abc,${country.id},${country.name}`;
    case "invalid_gender":
      return `Invalid Gender ${uniqueId},unknown,25,${country.id},${country.name}`;
    case "extreme_age":
      return `Extreme Age ${uniqueId},female,200,${country.id},${country.name}`;
    case "all_blank":
      return `,,,,`;
    default:
      return generateValidRow(uniqueId);
  }
}

// CONFIGURATION

const TARGET_ROWS = 50000;
const VALID_PERCENTAGE = 0.95;     // 95% valid
const DUPLICATE_PERCENTAGE = 0.02; // 2% duplicates
const INVALID_PERCENTAGE = 0.03;   // 3% invalid

const NUM_VALID_ROWS = Math.floor(TARGET_ROWS * VALID_PERCENTAGE);
const NUM_DUPLICATE_ROWS = Math.floor(TARGET_ROWS * DUPLICATE_PERCENTAGE);
const NUM_INVALID_ROWS = TARGET_ROWS - NUM_VALID_ROWS - NUM_DUPLICATE_ROWS;

const OUTPUT_FILE = 'test_500k.csv';


// GENERATE FILE USING STREAMING WRITE

console.log(' Generating 500K row CSV...');
console.log(`   Target: ${TARGET_ROWS.toLocaleString()} rows`);
console.log(`   Valid:      ${NUM_VALID_ROWS.toLocaleString()} (${VALID_PERCENTAGE * 100}%)`);
console.log(`   Duplicates: ${NUM_DUPLICATE_ROWS.toLocaleString()} (${DUPLICATE_PERCENTAGE * 100}%)`);
console.log(`   Invalid:    ${NUM_INVALID_ROWS.toLocaleString()} (${INVALID_PERCENTAGE * 100}%)`);
console.log('');

const startTime = Date.now();

//  Use stream write to avoid memory issues
const writeStream = fs.createWriteStream(OUTPUT_FILE);
writeStream.write("name,gender,age,country_id,country_name\n");

const validNames = [];
let progress = 0;

// Generate VALID rows
console.log(' Generating valid rows...');
for (let i = 0; i < NUM_VALID_ROWS; i++) {
  const row = generateValidRow(i);
  writeStream.write(row + "\n");

  // Track for duplicates
  const name = row.split(",")[0].toLowerCase().trim();
  validNames.push(name);

  progress++;
  if (progress % 50000 === 0) {
    console.log(`   ${progress.toLocaleString()} / ${NUM_VALID_ROWS.toLocaleString()} valid rows`);
  }
}

// Generate DUPLICATE rows
console.log(' Generating duplicate rows...');
for (let i = 0; i < NUM_DUPLICATE_ROWS; i++) {
  const dupName = randomChoice(validNames);
  const country = randomChoice(COUNTRIES);
  writeStream.write(`${dupName},male,30,${country.id},${country.name}\n`);

  if ((i + 1) % 5000 === 0) {
    console.log(`   ${(i + 1).toLocaleString()} / ${NUM_DUPLICATE_ROWS.toLocaleString()} duplicates`);
  }
}

// Generate INVALID rows
console.log(' Generating invalid rows...');
const invalidTypes = [
  "missing_name", "missing_gender", "missing_age",
  "negative_age", "invalid_age", "invalid_gender",
  "extreme_age", "all_blank"
];
for (let i = 0; i < NUM_INVALID_ROWS; i++) {
  writeStream.write(generateInvalidRow(randomChoice(invalidTypes), i) + "\n");

  if ((i + 1) % 5000 === 0) {
    console.log(`   ${(i + 1).toLocaleString()} / ${NUM_INVALID_ROWS.toLocaleString()} invalid`);
  }
}

writeStream.end();

writeStream.on('finish', () => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const stats = fs.statSync(OUTPUT_FILE);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log('');
  console.log(' Generation complete!');
  console.log(`   File: ${OUTPUT_FILE}`);
  console.log(`   Size: ${fileSizeMB} MB`);
  console.log(`   Total rows: ${TARGET_ROWS.toLocaleString()}`);
  console.log(`   Time: ${elapsed} seconds`);
  console.log('');
  console.log('Expected upload result:');
  console.log(`   total_rows: ${TARGET_ROWS}`);
  console.log(`   inserted:   ~${NUM_VALID_ROWS.toLocaleString()}`);
  console.log(`   skipped:    ~${(NUM_DUPLICATE_ROWS + NUM_INVALID_ROWS).toLocaleString()}`);
  console.log('     duplicate_name:  ~' + NUM_DUPLICATE_ROWS.toLocaleString());
  console.log('     invalid_age:     ~' + Math.floor(NUM_INVALID_ROWS * 0.5).toLocaleString());
  console.log('     missing_fields:  ~' + Math.floor(NUM_INVALID_ROWS * 0.4).toLocaleString());
  console.log('     invalid_gender:  ~' + Math.floor(NUM_INVALID_ROWS * 0.1).toLocaleString());
});