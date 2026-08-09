import { euclideanDistance, normalizeFaceDescriptor, calculateMatchScore } from "../services/faceVerification.service.js";

function main() {
  console.log("=========================================");
  console.log("🧪 VOTEX BIOMETRIC RECOGNITION SUITE");
  console.log("=========================================\n");

  // Generate synthetic 128-dimensional L2-normalized Face-API descriptor vectors
  const baseVectorA: number[] = new Array(128).fill(0).map((_, i) => Math.sin(i * 0.1));
  const normA = Math.sqrt(baseVectorA.reduce((sum, v) => sum + v * v, 0));
  const userADescriptor = baseVectorA.map((v) => v / normA);

  // User A same-person capture with natural micro-variance (lighting, pose, noise)
  const userANoisyDescriptor = userADescriptor.map((v, i) => v + (Math.sin(i * 0.5) * 0.03));
  const normANoisy = Math.sqrt(userANoisyDescriptor.reduce((sum, v) => sum + v * v, 0));
  const userALiveDescriptor = userANoisyDescriptor.map((v) => v / normANoisy);

  // User B completely different person descriptor
  const baseVectorB: number[] = new Array(128).fill(0).map((_, i) => Math.cos(i * 0.3));
  const normB = Math.sqrt(baseVectorB.reduce((sum, v) => sum + v * v, 0));
  const userBDescriptor = baseVectorB.map((v) => v / normB);

  console.log("1. Descriptor Validation:");
  const validA = normalizeFaceDescriptor(userADescriptor);
  const validLiveA = normalizeFaceDescriptor(userALiveDescriptor);
  const validB = normalizeFaceDescriptor(userBDescriptor);

  console.log(`   User A Registered Descriptor Length: ${validA?.length}`);
  console.log(`   User A Live Descriptor Length: ${validLiveA?.length}`);
  console.log(`   User B Registered Descriptor Length: ${validB?.length}`);

  if (!validA || !validLiveA || !validB) {
    console.error("❌ Validation Failed: Descriptors are invalid.");
    process.exit(1);
  }
  console.log("   ✅ All descriptors are valid 128-dimensional finite float vectors.\n");

  console.log("2. TEST A — SAME PERSON (User A Registered vs User A Live):");
  const distA = euclideanDistance(userADescriptor, userALiveDescriptor);
  const matchedA = distA <= 0.60;
  const scoreA = calculateMatchScore(distA);

  console.log(`   Distance: ${distA.toFixed(4)}`);
  console.log(`   Threshold: 0.60`);
  console.log(`   Match Score: ${scoreA}%`);
  console.log(`   Result: ${matchedA ? "PASSED (Identity Verified)" : "FAILED"}`);

  if (!matchedA) {
    console.error("❌ TEST A FAILED: Same person failed verification!");
    process.exit(1);
  }
  console.log("   ✅ TEST A PASSED!\n");

  console.log("3. TEST B — DIFFERENT PERSON (User A Registered vs User B Live):");
  const distB = euclideanDistance(userADescriptor, userBDescriptor);
  const matchedB = distB <= 0.60;
  const scoreB = calculateMatchScore(distB);

  console.log(`   Distance: ${distB.toFixed(4)}`);
  console.log(`   Threshold: 0.60`);
  console.log(`   Match Score: ${scoreB}%`);
  console.log(`   Result: ${!matchedB ? "PASSED (NO MATCH Correctly Triggered)" : "FAILED (False Positive)"}`);

  if (matchedB) {
    console.error("❌ TEST B FAILED: Different person falsely matched!");
    process.exit(1);
  }
  console.log("   ✅ TEST B PASSED!\n");

  console.log("=========================================");
  console.log("🎉 ALL BIOMETRIC TESTS PASSED SUCCESSFULLY");
  console.log("=========================================");
}

main();
