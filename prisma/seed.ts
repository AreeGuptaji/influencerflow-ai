import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NICHES = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Gaming",
  "Tech",
  "Lifestyle",
  "Business",
  "Education",
  "Entertainment",
  "Sports",
  "Music",
  "Art",
  "Photography",
  "Comedy",
  "Finance",
  "Health",
];

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn"];

// Generate a random number between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Randomly select n items from an array
function getRandomItems<T>(array: T[], n: number): T[] {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Generate a random engagement rate (1-10%)
function getRandomEngagementRate(): number {
  return parseFloat((Math.random() * 9 + 1).toFixed(2));
}

// Generate a random follower count
function getRandomFollowerCount(): number {
  const ranges = [
    { min: 1000, max: 10000 }, // 1K - 10K
    { min: 10000, max: 100000 }, // 10K - 100K
    { min: 100000, max: 1000000 }, // 100K - 1M
    { min: 1000000, max: 5000000 }, // 1M - 5M
  ];

  // Ensure we always get a valid range
  const selectedRange = ranges[Math.floor(Math.random() * ranges.length)];
  if (!selectedRange) {
    return 10000; // Default fallback
  }

  return getRandomInt(selectedRange.min, selectedRange.max);
}

// Generate sample creator profiles
async function createCreators() {
  const LOCATIONS = [
    "New York, USA",
    "Los Angeles, USA",
    "London, UK",
    "Paris, France",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Toronto, Canada",
    "Berlin, Germany",
    "Mumbai, India",
    "Dubai, UAE",
    "São Paulo, Brazil",
    "Singapore",
    "Barcelona, Spain",
    "Miami, USA",
    "Amsterdam, Netherlands",
  ];

  const FIRST_NAMES = [
    "Emma",
    "Liam",
    "Olivia",
    "Noah",
    "Ava",
    "Isabella",
    "Sophia",
    "Mia",
    "Charlotte",
    "Amelia",
    "Harper",
    "Evelyn",
    "Abigail",
    "Emily",
    "Elizabeth",
    "Sofia",
    "Avery",
    "Ella",
    "Scarlett",
    "Grace",
    "Chloe",
    "Victoria",
    "Riley",
    "Aria",
    "Lily",
    "Aubrey",
    "Zoey",
    "Penelope",
    "Lillian",
    "Addison",
    "Layla",
    "Natalie",
    "Camila",
    "Hannah",
    "Brooklyn",
    "Zoe",
    "Nora",
    "Leah",
    "Savannah",
    "Audrey",
    "Claire",
    "Eleanor",
    "Skylar",
    "Ellie",
    "Samantha",
    "Stella",
    "Paisley",
    "Violet",
    "Mila",
    "Aaliyah",
    "Lucy",
    "Anna",
    "Caroline",
    "Nova",
    "Genesis",
    "Emilia",
    "Kennedy",
    "Maya",
    "Willow",
    "Kinsley",
    "Naomi",
    "Aaliyah",
    "Elena",
    "Sarah",
    "Ariana",
    "Allison",
    "Gabriella",
    "Alice",
    "Madelyn",
    "Cora",
    "Ruby",
    "Eva",
    "Serenity",
    "Autumn",
    "Adeline",
    "Hailey",
    "Gianna",
    "Valentina",
    "Isla",
    "Eliana",
    "Quinn",
    "Nevaeh",
    "Ivy",
    "Sadie",
    "Piper",
    "Lydia",
    "Alexa",
    "Josephine",
    "Jackson",
    "Aiden",
    "Grayson",
    "Lucas",
    "Oliver",
    "Elijah",
    "James",
    "Benjamin",
    "Mason",
    "Ethan",
    "Alexander",
    "Henry",
    "Jacob",
    "Michael",
    "Daniel",
    "Logan",
    "Matthew",
    "Samuel",
    "Sebastian",
    "David",
    "Joseph",
    "Carter",
    "Owen",
    "Wyatt",
    "John",
    "Jack",
    "Luke",
    "Jayden",
    "Dylan",
    "Gabriel",
    "Isaac",
    "Anthony",
    "William",
    "Leo",
    "Hudson",
    "Lincoln",
    "Levi",
    "Christian",
    "Josiah",
    "Andrew",
    "Thomas",
    "Joshua",
    "Ezra",
    "Charles",
    "Caleb",
    "Isaiah",
    "Ryan",
    "Nathan",
    "Adrian",
    "Nolan",
    "Jordan",
    "Colton",
    "Cameron",
    "Hunter",
    "Austin",
    "Jason",
    "Dominic",
    "Jose",
  ];

  const LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
    "Gomez",
    "Phillips",
    "Evans",
    "Turner",
    "Diaz",
    "Parker",
    "Cruz",
    "Edwards",
    "Collins",
    "Reyes",
    "Stewart",
    "Morris",
    "Morales",
    "Murphy",
    "Cook",
    "Rogers",
    "Gutierrez",
    "Ortiz",
    "Morgan",
    "Cooper",
    "Peterson",
    "Bailey",
    "Reed",
    "Kelly",
    "Howard",
    "Ramos",
    "Kim",
    "Cox",
    "Ward",
    "Richardson",
    "Watson",
    "Brooks",
    "Chavez",
    "Wood",
    "James",
    "Bennett",
    "Gray",
    "Mendoza",
    "Ruiz",
    "Hughes",
    "Price",
    "Alvarez",
    "Castillo",
    "Sanders",
    "Patel",
    "Myers",
    "Long",
    "Ross",
    "Foster",
    "Jimenez",
    "Chen",
    "Wang",
    "Li",
    "Singh",
    "Yang",
    "Wu",
    "Lin",
    "Zhao",
    "Xu",
    "Huang",
  ];

  console.log("Creating sample creator profiles...");

  // Generate 50 sample creators
  const creators = Array.from({ length: 50 }, () => {
    const firstName =
      FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] ?? "John";
    const lastName =
      LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] ?? "Doe";
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(1, 999)}`;

    const niche1 = getRandomItems(NICHES, 1)[0] ?? "Lifestyle";
    const niche2 = getRandomItems(NICHES, 1)[0] ?? "Fashion";

    return {
      name,
      username,
      email: `${username}@example.com`,
      bio: `Content creator specializing in ${niche1} and ${niche2}.`,
      niches: getRandomItems(NICHES, getRandomInt(1, 3)),
      followerCount: getRandomFollowerCount(),
      platforms: getRandomItems(PLATFORMS, getRandomInt(1, 3)),
      location: getRandomItems(LOCATIONS, 1)[0] ?? "Global",
      engagementRate: getRandomEngagementRate(),
      recentContent: [
        `https://example.com/content/${username}/1`,
        `https://example.com/content/${username}/2`,
        `https://example.com/content/${username}/3`,
      ],
    };
  });

  // Bulk create creators
  await prisma.creatorProfile.createMany({
    data: creators,
    skipDuplicates: true,
  });

  console.log(`Created ${creators.length} creator profiles`);
}

async function main() {
  try {
    await createCreators();
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
