import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const ADMIN_EMAIL = "admin@ttrnottingham.com";

const exclusions = [
  ["Amanda", "Nick Farmer"],
  ["Nick Farmer", "Amanda"],
  ["Mel", "Mark"],
  ["Mark", "Mel"]
];

// ======================================
// EVENT LISTENERS
// ======================================

document.getElementById("registerBtn")?.addEventListener("click", registerUser);
document.getElementById("loginBtn")?.addEventListener("click", loginUser);
document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
document.getElementById("adminLogoutBtn")?.addEventListener("click", handleLogout);
document.getElementById("saveWishlistBtn")?.addEventListener("click", saveWishlist);
document.getElementById("saveRsvpBtn")?.addEventListener("click", saveRsvp);
document.getElementById("saveBudgetBtn")?.addEventListener("click", saveBudget);
document.getElementById("toggleRegistrationBtn")?.addEventListener("click", toggleRegistration);
document.getElementById("generateDrawBtn")?.addEventListener("click", generateDraw);

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout Error:", err);
  }
}

// ======================================
// REGISTER
// ======================================

async function registerUser() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const wishlistInput = document.getElementById("wishlist");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const wishlist = wishlistInput.value.split("\n").map(s => s.trim()).filter(Boolean);

  if (!name || !email || !password) {
    alert("Please fill in your name, email, and password.");
    return;
  }

  try {
    // 1. Check if registration is open
    const settingsRef = doc(db, "settings", "event");
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists() && settingsSnap.data().registrationOpen === false) {
      alert("Registration is currently closed.");
      return;
    }

    // 2. Create Auth User
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Create Participant Document
    await setDoc(doc(db, "participants", cred.user.uid), {
      name,
      email,
      role: "participant",
      wishlist,
      rsvp: true,
      recipient: "",
      giftStatus: "Not Started"
    });

    alert("Registration successful! Welcome to Secret Santa.");
    
    // Clear inputs
    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    wishlistInput.value = "";

  } catch (error) {
    console.error("Registration error:", error);
    alert(error.message);
  }
}

// ======================================
// LOGIN
// ======================================

async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login error:", error);
    alert(error.message);
  }
}

// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(auth, async (user) => {
  const authCard = document.getElementById("authCard");
  const dashboard = document.getElementById("dashboard");
  const adminPanel = document.getElementById("adminPanel");

  if (!user) {
    authCard.classList.remove("hidden");
    dashboard.classList.add("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  // Admin View
  if (user.email === ADMIN_EMAIL) {
    authCard.classList.add("hidden");
    dashboard.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    await loadAdminDashboard();
    return;
  }

  // Participant View
  authCard.classList.add("hidden");
  dashboard.classList.remove("hidden");
  adminPanel.classList.add("hidden");

  try {
    // Load Settings
    const settingsSnap = await getDoc(doc(db, "settings", "event"));
    if (settingsSnap.exists()) {
      document.getElementById("budget").textContent = settingsSnap.data().budget ?? 20;
    }

    // Load User Data
    const snapshot = await getDoc(doc(db, "participants", user.uid));
    if (snapshot.exists()) {
      const data = snapshot.data();
      document.getElementById("userName").textContent = data.name || "Participant";
      document.getElementById("wishlistEdit").value = (data.wishlist || []).join("\n");
      document.getElementById("rsvp").value = String(data.rsvp ?? true);
      document.getElementById("recipient").textContent = data.recipient || "Not assigned yet";
    }
  } catch (err) {
    console.error("Error loading user data:", err);
  }
});

// ======================================
// WISHLIST & RSVP
// ======================================

async function saveWishlist() {
  const user = auth.currentUser;
  if (!user) return;

  const wishlist = document.getElementById("wishlistEdit").value.split("\n").map(s => s.trim()).filter(Boolean);

  try {
    await updateDoc(doc(db, "participants", user.uid), { wishlist });
    alert("Wishlist updated!");
  } catch (err) {
    console.error(err);
    alert("Could not update wishlist: " + err.message);
  }
}

async function saveRsvp() {
  const user = auth.currentUser;
  if (!user) return;

  const rsvp = document.getElementById("rsvp").value === "true";

  try {
    await updateDoc(doc(db, "participants", user.uid), { rsvp });
    alert("RSVP status saved.");
  } catch (err) {
    console.error(err);
    alert("Could not update RSVP: " + err.message);
  }
}

// ======================================
// ADMIN OPERATIONS
// ======================================

async function loadAdminDashboard() {
  try {
    const settingsSnap = await getDoc(doc(db, "settings", "event"));
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      document.getElementById("budgetDisplay").textContent = settings.budget ?? 20;
      document.getElementById("budgetInput").value = settings.budget ?? 20;
      
      const toggleBtn = document.getElementById("toggleRegistrationBtn");
      if (toggleBtn) {
        toggleBtn.textContent = settings.registrationOpen !== false ? "🔒 Close Registration" : "🔓 Open Registration";
      }
    }

    const snapshot = await getDocs(collection(db, "participants"));
    const participants = [];
    snapshot.forEach(docSnap => {
      participants.push({ id: docSnap.id, ...docSnap.data() });
    });

    document.getElementById("participantCount").textContent = participants.length;

    let html = "";
    participants.forEach((p) => {
      html += `
        <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:8px;">
          <strong>${escapeHtml(p.name || "Unknown")}</strong> (${escapeHtml(p.email || "No Email")})<br>
          RSVP: ${p.rsvp ? "✅ Attending" : "❌ Not Attending"}<br>
          Assigned Recipient: <strong>${escapeHtml(p.recipient || "Unassigned")}</strong>
        </div>
      `;
    });

    document.getElementById("participantList").innerHTML = html || "<p>No participants registered yet.</p>";
  } catch (err) {
    console.error("Admin dashboard load failed:", err);
    alert("Failed to load admin dashboard: " + err.message);
  }
}

async function saveBudget() {
  const budget = Number(document.getElementById("budgetInput").value);
  if (isNaN(budget) || budget < 1) {
    alert("Please provide a valid budget amount.");
    return;
  }

  try {
    await setDoc(doc(db, "settings", "event"), { budget }, { merge: true });
    document.getElementById("budgetDisplay").textContent = budget;
    alert("Budget updated successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to save budget: " + err.message);
  }
}

async function toggleRegistration() {
  const settingsRef = doc(db, "settings", "event");
  try {
    const settingsSnap = await getDoc(settingsRef);
    const current = settingsSnap.exists() ? settingsSnap.data().registrationOpen : true;
    const nextState = !current;

    await setDoc(settingsRef, { registrationOpen: nextState }, { merge: true });
    document.getElementById("toggleRegistrationBtn").textContent = nextState ? "🔒 Close Registration" : "🔓 Open Registration";
    alert(`Registration is now ${nextState ? "OPEN" : "CLOSED"}.`);
  } catch (err) {
    console.error(err);
    alert("Failed to toggle registration: " + err.message);
  }
}

// ======================================
// ROBUST DRAW GENERATION
// ======================================

function isProhibited(giverName, receiverName) {
  return exclusions.some(
    ([a, b]) => (a.toLowerCase() === giverName.toLowerCase() && b.toLowerCase() === receiverName.toLowerCase())
  );
}

// Backtracking Hamiltonian / Derangement Solver to guarantee no infinite loops
function solveSecretSanta(givers, receivers, currentMatches = {}) {
  if (givers.length === 0) return currentMatches;

  const giver = givers[0];
  const remainingGivers = givers.slice(1);

  // Randomize available candidate order
  const candidates = receivers.slice().sort(() => Math.random() - 0.5);

  for (const candidate of candidates) {
    if (candidate.id !== giver.id && !isProhibited(giver.name, candidate.name)) {
      const remainingReceivers = receivers.filter(r => r.id !== candidate.id);
      const result = solveSecretSanta(remainingGivers, remainingReceivers, {
        ...currentMatches,
        [giver.id]: candidate
      });
      if (result) return result;
    }
  }
  return null;
}

async function generateDraw() {
  if (!confirm("Are you sure you want to generate the Secret Santa draw? This will reassign all recipients.")) {
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "participants"));
    const eligiblePlayers = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Exclude Admin or users who explicitly marked RSVP as false
      if (data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || data.role === "admin" || data.rsvp === false) {
        return;
      }
      eligiblePlayers.push({ id: docSnap.id, ...data });
    });

    if (eligiblePlayers.length < 3) {
      alert("At least 3 attending participants are required to run the draw.");
      return;
    }

    const solution = solveSecretSanta(eligiblePlayers, eligiblePlayers);

    if (!solution) {
      alert("Could not generate a valid draw matching all exclusion rules. Please check your participant exclusions.");
      return;
    }

    // Atomic write batch prevents partial assignments on failure
    const batch = writeBatch(db);

    for (const giver of eligiblePlayers) {
      const recipient = solution[giver.id];

      // Record assignment
      const assignRef = doc(db, "assignments", giver.id);
      batch.set(assignRef, {
        giverId: giver.id,
        giverName: giver.name,
        recipientId: recipient.id,
        recipientName: recipient.name
      });

      // Update participant record
      const participantRef = doc(db, "participants", giver.id);
      batch.update(participantRef, {
        recipient: recipient.name
      });
    }

    // Mark draw as completed in settings
    batch.set(doc(db, "settings", "event"), { drawCompleted: true }, { merge: true });

    await batch.commit();

    alert("🎄 Secret Santa draw successfully generated!");
    await loadAdminDashboard();
  } catch (err) {
    console.error("Error generating draw:", err);
    alert("Draw generation failed: " + err.message);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
