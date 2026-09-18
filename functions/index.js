/**
 * Firebase Cloud Functions for CivicTrack / UrbanFix Intelligence
 * Server-Side Automatic SLA Escalation Job
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

/**
 * Scheduled Cloud Function: Runs every 15 minutes to evaluate overdue complaints in Firestore.
 * Performs database-level automatic escalation independently of any active browser sessions.
 */
exports.checkOverdueSlaEscalations = onSchedule("every 15 minutes", async (event) => {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  try {
    const listingsRef = db.collection("listings");
    // Query unresolved listings that are not already escalated
    const snapshot = await listingsRef
      .where("status", "!=", "Resolved")
      .get();

    if (snapshot.empty) {
      console.log("No unresolved complaints found for SLA check.");
      return;
    }

    const batch = db.batch();
    let escalatedCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Skip if already escalated
      if (data.slaStatus === "ESCALATED") return;

      const deadlineIso = data.slaDeadlineAt;
      if (!deadlineIso) return;

      const deadlineMs = new Date(deadlineIso).getTime();
      if (isNaN(deadlineMs)) return;

      // If SLA deadline passed
      if (deadlineMs < nowMs) {
        const fromAuthority = data.assignedWorkerName || "Assigned Department";
        const toAuthority = "Municipal HQ / Admin Control Center";
        const reason = `SLA resolution deadline (${data.slaDurationHours || 48}h) exceeded without closure.`;

        const escalationEvent = {
          id: `esc-${docSnap.id}-${nowMs}`,
          escalatedAt: nowIso,
          fromAuthority,
          toAuthority,
          reason,
          level: 3,
        };

        const timelineEvent = {
          id: `t-esc-${nowMs}`,
          status: data.status || "In Progress",
          timestamp: "Just now",
          title: "⚠️ Automatically Escalated to Higher Authority",
          description: `Complaint #${data.ticketNumber} exceeded SLA deadline. Escalated to ${toAuthority}.`,
          actor: "CivicTrack Server-Side SLA Scheduler",
        };

        const docRef = listingsRef.doc(docSnap.id);
        batch.update(docRef, {
          slaStatus: "ESCALATED",
          escalatedAt: nowIso,
          escalatedFrom: fromAuthority,
          escalatedTo: toAuthority,
          escalationReason: reason,
          escalationHistory: FieldValue.arrayUnion(escalationEvent),
          timeline: FieldValue.arrayUnion(timelineEvent),
          updatedAt: Timestamp.now(),
        });

        escalatedCount++;
      }
    });

    if (escalatedCount > 0) {
      await batch.commit();
      console.log(`Successfully escalated ${escalatedCount} overdue complaint(s) server-side.`);
    } else {
      console.log("All active complaints are within SLA parameters.");
    }
  } catch (error) {
    console.error("Error in server-side SLA escalation job:", error);
  }
});
