import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Subhash107k:Kriti%401435%40%23@cluster0.jlxznc6.mongodb.net/votex_db?retryWrites=true&w=majority";
const DB_NAME = process.env.MONGODB_DB_NAME || "votex_db";

async function seedDatabase() {
  console.log("==================================================");
  console.log("🌱 VoTex MongoDB Atlas Seeding Tool");
  console.log("==================================================");
  console.log(`Connecting to MongoDB Atlas... (DB: ${DB_NAME})`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const passwordHash = bcrypt.hashSync("Password123!", 10);

  // 1. Seed Users (1 Admin, 5 Voters, 5 Candidates)
  const usersCollection = db.collection("users");

  const seedUsers = [
    // Admin
    {
      id: "usr_seed_admin",
      fullName: "System Administrator",
      username: "admin",
      nationalID: "ADMIN001",
      email: "admin@votex.gov",
      mobile: "+9779800000000",
      passwordHash,
      role: "Administrator",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
    // 5 Voters
    ...Array.from({ length: 5 }).map((_, i) => ({
      id: `usr_seed_voter_${i + 1}`,
      fullName: `Sample Voter ${i + 1}`,
      username: `voter${i + 1}`,
      nationalID: `VOTER00${i + 1}`,
      email: `voter${i + 1}@votex.gov`,
      mobile: `+977980000000${i + 1}`,
      passwordHash,
      role: "Voter",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
      faceImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      fingerprintImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      profilePhoto: `https://ui-avatars.com/api/?name=Voter+${i + 1}`,
    })),
    // 5 Candidates
    {
      id: "usr_seed_cand_1",
      fullName: "Gagan Thapa",
      username: "candidate1",
      nationalID: "CAND001",
      citizenshipNumber: "99901-0001-C1",
      email: "gagan.thapa@nc.org.np",
      mobile: "+9779800000010",
      passwordHash,
      role: "Candidate",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
    {
      id: "usr_seed_cand_2",
      fullName: "Gokarna Bista",
      username: "candidate2",
      nationalID: "CAND002",
      citizenshipNumber: "99902-0002-C2",
      email: "gokarna.bista@cpnuml.org",
      mobile: "+9779800000011",
      passwordHash,
      role: "Candidate",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
    {
      id: "usr_seed_cand_3",
      fullName: "Barshaman Pun",
      username: "candidate3",
      nationalID: "CAND003",
      citizenshipNumber: "99903-0003-C3",
      email: "barshaman.pun@cpmmaoist.org",
      mobile: "+9779800000012",
      passwordHash,
      role: "Candidate",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
    {
      id: "usr_seed_cand_4",
      fullName: "Swarnim Wagle",
      username: "candidate4",
      nationalID: "CAND004",
      citizenshipNumber: "99904-0004-C4",
      email: "swarnim.wagle@rsp.org.np",
      mobile: "+9779800000013",
      passwordHash,
      role: "Candidate",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
    {
      id: "usr_seed_cand_5",
      fullName: "Rajendra Lingden",
      username: "candidate5",
      nationalID: "CAND005",
      citizenshipNumber: "99905-0005-C5",
      email: "rajendra.lingden@rpp.org.np",
      mobile: "+9779800000014",
      passwordHash,
      role: "Candidate",
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      isProfileComplete: true,
      accountStatus: "Approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenVersion: 0,
    },
  ];

  for (const user of seedUsers) {
    await usersCollection.updateOne(
      { id: user.id },
      { $set: user },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${seedUsers.length} Users (1 Admin, 5 Voters, 5 Candidates)`);

  // 2. Seed Voter Profiles
  const profilesCollection = db.collection("user_profiles");
  const seedUserProfiles = seedUsers
    .filter((u) => u.role === "Voter")
    .map((u, i) => ({
      id: `prof_seed_${i + 1}`,
      userId: u.id,
      fullName: u.fullName,
      fullNameNepali: `नमूना मतदाता ${i + 1}`,
      dob: `199${i}-01-01`,
      gender: i % 2 === 0 ? "Male" : "Female",
      occupation: "Software Engineer",
      maritalStatus: "Single",
      educationStatus: "Bachelor's Degree",
      bloodGroup: "O+",
      nationality: "Nepalese",
      permCountry: "Nepal",
      permProvince: "Bagmati",
      permDistrict: "Kathmandu",
      permMunicipality: "Kathmandu Metropolitan City",
      permWardNumber: "10",
      permTole: "Baneshwor",
      isTemporarySameAsPermanent: true,
      fatherName: `Father of Voter ${i + 1}`,
      motherName: `Mother of Voter ${i + 1}`,
      grandfatherName: `Grandfather of Voter ${i + 1}`,
      citizenshipNumber: `12345-6789-${i}`,
      citizenshipType: "Descendant",
      citizenshipIssueDate: "2015-05-15",
      citizenshipIssueDistrict: "Kathmandu",
      nidNumber: `NID-987654321-${i}`,
      createdAt: new Date().toISOString(),
    }));

  for (const prof of seedUserProfiles) {
    await profilesCollection.updateOne({ id: prof.id }, { $set: prof }, { upsert: true });
  }
  console.log(`✅ Seeded ${seedUserProfiles.length} Voter Profiles`);

  // 3. Seed Political Parties
  const partiesCollection = db.collection("political_parties");
  const seedParties = [
    { id: "party_nc", name: "Nepali Congress", symbol: "Tree", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nepali_Congress_Election_Symbol.png" },
    { id: "party_uml", name: "CPN-UML", symbol: "Sun", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Election_Symbol_of_the_Communist_Party_of_Nepal_%28Unified_Marxist-Leninist%29.png" },
    { id: "party_maoist", name: "CPN-Maoist Centre", symbol: "Hammer and Sickle", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Hammer_and_sickle_inside_circle.svg" },
    { id: "party_rsp", name: "Rastriya Swatantra Party", symbol: "Bell", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Bell_election_symbol_of_RSP.png" },
    { id: "party_rpp", name: "Rastriya Prajatantra Party", symbol: "Cow", logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_RPP.svg" },
  ];

  for (const party of seedParties) {
    await partiesCollection.updateOne({ id: party.id }, { $set: party }, { upsert: true });
  }
  console.log(`✅ Seeded ${seedParties.length} Political Parties`);

  // 4. Seed Elections
  const electionsCollection = db.collection("elections");
  const seedElections = [
    {
      id: "elect_seed_2026",
      title: "Federal General Parliamentary Election 2026",
      description: "National parliamentary election for electing House of Representatives members across all federal constituencies.",
      status: "Active",
      isActive: true,
      type: "General Election",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      resultsPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "elect_prov_2026",
      title: "Provincial Assembly Council Election 2026",
      description: "Regional legislative assembly election for state policy implementation.",
      status: "Active",
      isActive: true,
      type: "Provincial Election",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      resultsPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const elec of seedElections) {
    await electionsCollection.updateOne({ id: elec.id }, { $set: elec }, { upsert: true });
  }
  console.log(`✅ Seeded ${seedElections.length} Active Elections`);

  // 5. Seed Candidates
  const candidatesCollection = db.collection("candidates");
  const seedCandidates = [
    {
      id: "cand_seed_1",
      userId: "usr_seed_cand_1",
      electionId: "elect_seed_2026",
      name: "Gagan Thapa",
      party: "Nepali Congress",
      biography: "Youth leader and community-focused public servant. Known for advocating democratic reforms.",
      manifestoText: "Focusing on transparent digital governance, AI-based anti-corruption auditing, green energy transition, and modern public transit infrastructure.",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      status: "Approved",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: "1976-07-16",
      gender: "Male",
      profession: "Politician",
      education: "Masters in Political Science",
      contactNumber: "+9779800000010",
      emailAddress: "gagan.thapa@nc.org.np",
      permanentAddress: "Kathmandu, Nepal",
    },
    {
      id: "cand_seed_2",
      userId: "usr_seed_cand_2",
      electionId: "elect_seed_2026",
      name: "Gokarna Bista",
      party: "CPN-UML",
      biography: "Technology and transparency advocate. Former minister of energy.",
      manifestoText: "Empowering rural youth entrepreneurship, universal digital healthcare passes, healthcare digitisation, and public education overhaul.",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
      status: "Approved",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: "1965-07-01",
      gender: "Male",
      profession: "Politician",
      education: "Bachelors Degree",
      contactNumber: "+9779800000011",
      emailAddress: "gokarna.bista@cpnuml.org",
      permanentAddress: "Gulmi, Nepal",
    },
    {
      id: "cand_seed_3",
      userId: "usr_seed_cand_3",
      electionId: "elect_seed_2026",
      name: "Barshaman Pun",
      party: "CPN-Maoist Centre",
      biography: "Advocating for rural development and digital equality.",
      manifestoText: "Championing zero-bureaucracy digital identity, open budget tracking, direct public referendum tools, and startup grants.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      status: "Approved",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: "1971-06-02",
      gender: "Male",
      profession: "Politician",
      education: "Bachelors Degree",
      contactNumber: "+9779800000012",
      emailAddress: "barshaman.pun@cpmmaoist.org",
      permanentAddress: "Rolpa, Nepal",
    },
    {
      id: "cand_seed_4",
      userId: "usr_seed_cand_4",
      electionId: "elect_seed_2026",
      name: "Swarnim Wagle",
      party: "Rastriya Swatantra Party",
      biography: "Economist and public policy practitioner dedicated to institutional reform.",
      manifestoText: "Economic acceleration, governance digitisation, public sector auditing, and innovation investment.",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
      status: "Approved",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: "1974-05-09",
      gender: "Male",
      profession: "Economist & Politician",
      education: "PhD in Economics (Australian National University)",
      contactNumber: "+9779800000013",
      emailAddress: "swarnim.wagle@rsp.org.np",
      permanentAddress: "Tanahun, Nepal",
    },
    {
      id: "cand_seed_5",
      userId: "usr_seed_cand_5",
      electionId: "elect_seed_2026",
      name: "Rajendra Lingden",
      party: "Rastriya Prajatantra Party",
      biography: "National political figure focusing on cultural heritage preservation and systemic integrity.",
      manifestoText: "Anti-corruption enforcement, local infrastructure development, and accountable public administration.",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      status: "Approved",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: "1966-03-24",
      gender: "Male",
      profession: "Politician",
      education: "Bachelors Degree",
      contactNumber: "+9779800000014",
      emailAddress: "rajendra.lingden@rpp.org.np",
      permanentAddress: "Jhapa, Nepal",
    },
  ];

  for (const cand of seedCandidates) {
    await candidatesCollection.updateOne({ id: cand.id }, { $set: cand }, { upsert: true });
  }
  console.log(`✅ Seeded ${seedCandidates.length} Candidates`);

  await client.close();
  console.log("==================================================");
  console.log("🎉 MongoDB Atlas Database Seeding Completed Successfully!");
  console.log("==================================================");
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
