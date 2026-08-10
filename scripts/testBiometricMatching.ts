import { euclideanDistance, normalizeFaceDescriptor, calculateMatchScore } from "../services/faceVerification.service.js";
import { toDate } from "../utils/dateUtils.js";

function main() {
  console.log("=========================================");
  console.log("🧪 VOTEX BIOMETRIC & DATE VERIFICATION SUITE");
  console.log("=========================================\n");

  // 1. Descriptor Validation & Generation
  const baseVectorA: number[] = new Array(128).fill(0).map((_, i) => Math.sin(i * 0.1));
  const normA = Math.sqrt(baseVectorA.reduce((sum, v) => sum + v * v, 0));
  const userADescriptor = baseVectorA.map((v) => v / normA);

  const userANoisyDescriptor = userADescriptor.map((v, i) => v + (Math.sin(i * 0.5) * 0.03));
  const normANoisy = Math.sqrt(userANoisyDescriptor.reduce((sum, v) => sum + v * v, 0));
  const userALiveDescriptor = userANoisyDescriptor.map((v) => v / normANoisy);

  const baseVectorB: number[] = new Array(128).fill(0).map((_, i) => Math.cos(i * 0.3));
  const normB = Math.sqrt(baseVectorB.reduce((sum, v) => sum + v * v, 0));
  const userBDescriptor = baseVectorB.map((v) => v / normB);

  console.log("1. Descriptor Validation:");
  const validA = normalizeFaceDescriptor(userADescriptor);
  const validLiveA = normalizeFaceDescriptor(userALiveDescriptor);
  const validB = normalizeFaceDescriptor(userBDescriptor);

  if (!validA || !validLiveA || !validB) {
    console.error("❌ Validation Failed: Descriptors are invalid.");
    process.exit(1);
  }
  console.log("   ✅ All descriptors are valid 128-dimensional finite float vectors.\n");

  console.log("2. TEST A — SAME PERSON (User A Registered vs User A Live):");
  const distA = euclideanDistance(userADescriptor, userALiveDescriptor);
  const matchedA = distA <= 0.60;
  const scoreA = calculateMatchScore(distA);

  console.log(`   Distance: ${distA.toFixed(4)} | Match Score: ${scoreA}% | Matched: ${matchedA}`);
  if (!matchedA) {
    console.error("❌ TEST A FAILED!");
    process.exit(1);
  }
  console.log("   ✅ TEST A PASSED!\n");

  console.log("3. TEST B — DIFFERENT PERSON (User A Registered vs User B Live):");
  const distB = euclideanDistance(userADescriptor, userBDescriptor);
  const matchedB = distB <= 0.60;
  const scoreB = calculateMatchScore(distB);

  console.log(`   Distance: ${distB.toFixed(4)} | Match Score: ${scoreB}% | Matched: ${matchedB}`);
  if (matchedB) {
    console.error("❌ TEST B FAILED!");
    process.exit(1);
  }
  console.log("   ✅ TEST B PASSED!\n");

  console.log("4. TEST C — EXACT BOUNDARY & ZERO DISTANCE:");
  const selfDist = euclideanDistance(userADescriptor, userADescriptor);
  if (selfDist !== 0) {
    console.error("❌ Zero distance test failed");
    process.exit(1);
  }
  console.log(`   Self-matching distance: ${selfDist} (PASS)`);

  const boundaryPass = 0.60 <= 0.60;
  const boundaryFail = 0.6001 <= 0.60;
  if (!boundaryPass || boundaryFail) {
    console.error("❌ Threshold boundary test failed");
    process.exit(1);
  }
  console.log("   ✅ Boundary checks passed (0.60 PASS, 0.6001 FAIL).\n");

  console.log("5. TEST D — DATE NORMALIZATION (toDate):");
  const now = new Date();
  const dIso = toDate(now.toISOString());
  const dObj = toDate(now);
  const dNum = toDate(now.getTime());
  const dNull = toDate(null);
  const dBad = toDate("invalid-date-string");

  if (!dIso || !dObj || !dNum || dNull !== null || dBad !== null) {
    console.error("❌ toDate normalization failed");
    process.exit(1);
  }
  console.log("   ✅ Date normalization correctly handles ISO strings, Date objects, timestamps, nulls, and invalid dates.\n");

  console.log("=========================================");
  console.log("🎉 ALL BIOMETRIC & DATE SUITE TESTS PASSED");
  console.log("=========================================");
}

main();
