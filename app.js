const ADMIN_EMAIL = "admin@ttrnottingham.com";

import {
  auth,
  db
} from "./firebase-config.js";

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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// ======================================
// EVENT LISTENERS
// ======================================

document
  .getElementById("registerBtn")
  ?.addEventListener("click", registerUser);

document
  .getElementById("loginBtn")
  ?.addEventListener("click", loginUser);

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", () => signOut(auth));

document
  .getElementById("adminLogoutBtn")
  ?.addEventListener("click", () => signOut(auth));

document
  .getElementById("saveWishlistBtn")
  ?.addEventListener("click", saveWishlist);

document
  .getElementById("saveRsvpBtn")
  ?.addEventListener("click", saveRsvp);

document
  .getElementById("saveBudgetBtn")
  ?.addEventListener("click", saveBudget);

document
  .getElementById("toggleRegistrationBtn")
  ?.addEventListener("click", toggleRegistration);

document
  .getElementById("generateDrawBtn")
  ?.addEventListener("click", generateDraw);


// ======================================
// REGISTER
// ======================================

async function registerUser() {

  try {

    const settingsRef =
      doc(db, "settings", "event");

    const settingsSnap =
      await getDoc(settingsRef);

    if (
      settingsSnap.exists() &&
      settingsSnap.data().registrationOpen === false
    ) {

      alert("Registration is closed.");
      return;

    }

    const name =
      document
        .getElementById("name")
        .value
        .trim();

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value
        .trim();

    const wishlist =
      document
        .getElementById("wishlist")
        .value
        .split("\n")
        .filter(Boolean);

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await setDoc(
      doc(
        db,
        "participants",
        result.user.uid
      ),
      {
        name,
        email,
        role: "participant",
        wishlist,
        rsvp: true,
        recipient: "",
        giftStatus: "Not Started"
      }
    );

    alert("Registration successful!");

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

}


// ======================================
// LOGIN
// ======================================

async function loginUser() {

  try {

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim();

    const password =
      document
        .getElementById("loginPassword")
        .value
        .trim();

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

}


// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      document
        .getElementById("authCard")
        .classList.remove("hidden");

      document
        .getElementById("dashboard")
        .classList.add("hidden");

      document
        .getElementById("adminPanel")
        .classList.add("hidden");

      return;
    }

    // ==================================
    // ADMIN LOGIN
    // ==================================

    if (
      user.email === ADMIN_EMAIL
    ) {

      document
        .getElementById("authCard")
        .classList.add("hidden");

      document
        .getElementById("dashboard")
        .classList.add("hidden");

      document
        .getElementById("adminPanel")
        .classList.remove("hidden");

      await loadAdminDashboard();

      return;
    }

    // ==================================
    // PARTICIPANT LOGIN
    // ==================================

    document
      .getElementById("authCard")
      .classList.add("hidden");

    document
      .getElementById("dashboard")
      .classList.remove("hidden");

    document
      .getElementById("adminPanel")
      .classList.add("hidden");

    const settingsSnap =
      await getDoc(
        doc(
          db,
          "settings",
          "event"
        )
      );

    if (settingsSnap.exists()) {

      document
        .getElementById("budget")
        .textContent =
        settingsSnap.data().budget || 20;

    }

    const snapshot =
      await getDoc(
        doc(
          db,
          "participants",
          user.uid
        )
      );

    if (!snapshot.exists()) {

      console.log(
        "Participant document not found."
      );

      return;
    }

    const data =
      snapshot.data();

    document
      .getElementById("userName")
      .textContent =
      data.name || "";

    document
      .getElementById("wishlistEdit")
      .value =
      (data.wishlist || [])
      .join("\n");

    document
      .getElementById("rsvp")
      .value =
      String(data.rsvp);

    if (data.recipient) {

      document
        .getElementById("recipient")
        .textContent =
        data.recipient;

    }

  }
);


// ======================================
// WISHLIST
// ======================================

async function saveWishlist() {

  const user =
    auth.currentUser;

  if (!user) return;

  const wishlist =
    document
      .getElementById("wishlistEdit")
      .value
      .split("\n")
      .filter(Boolean);

  await updateDoc(
    doc(
      db,
      "participants",
      user.uid
    ),
    {
      wishlist
    }
  );

  alert("Wishlist updated.");
}


// ======================================
// RSVP
// ======================================

async function saveRsvp() {

  const user =
    auth.currentUser;

  if (!user) return;

  const rsvp =
    document
      .getElementById("rsvp")
      .value === "true";

  await updateDoc(
    doc(
      db,
      "participants",
      user.uid
    ),
    {
      rsvp
    }
  );

  alert("RSVP updated.");
}


// ======================================
// ADMIN DASHBOARD
// ======================================

async function loadAdminDashboard() {

  const settingsSnap =
    await getDoc(
      doc(
        db,
        "settings",
        "event"
      )
    );

  if (settingsSnap.exists()) {

    const settings =
      settingsSnap.data();

    document
      .getElementById("budgetDisplay")
      .textContent =
      settings.budget || 20;

    document
      .getElementById("budgetInput")
      .value =
      settings.budget || 20;

  }

  const snapshot =
    await getDocs(
      collection(
        db,
        "participants"
      )
    );

  const participants = [];

  snapshot.forEach(
    (docSnap) => {

      participants.push(
        docSnap.data()
      );

    }
  );

  document
    .getElementById("participantCount")
    .textContent =
    participants.length;

  let html = "";

  participants.forEach(
    (p) => {

      html += `
        <div style="
          border:1px solid #ddd;
          padding:10px;
          margin-bottom:10px;
          border-radius:8px;
        ">
          <strong>${p.name || "Unknown"}</strong><br>
          RSVP:
          ${p.rsvp ? "✅ Attending" : "❌ Not Confirmed"}
        </div>
      `;

    }
  );

  document
    .getElementById("participantList")
    .innerHTML =
    html;
}


// ======================================
// SAVE BUDGET
// ======================================

async function saveBudget() {

  const budget =
    Number(
      document
        .getElementById("budgetInput")
        .value
    );

  await setDoc(
    doc(
      db,
      "settings",
      "event"
    ),
    {
      budget
    },
    {
      merge: true
    }
  );

  document
    .getElementById("budgetDisplay")
    .textContent =
    budget;

  alert("Budget updated.");
}


// ======================================
// OPEN/CLOSE REGISTRATION
// ======================================

async function toggleRegistration() {

  const settingsRef =
    doc(
      db,
      "settings",
      "event"
    );

  const settingsSnap =
    await getDoc(settingsRef);

  const current =
    settingsSnap.data().registrationOpen;

  await setDoc(
    settingsRef,
    {
      registrationOpen: !current
    },
    {
      merge: true
    }
  );

  alert(
    `Registration ${!current ? "opened" : "closed"}`
  );
}


// ======================================
// EXCLUSIONS
// ======================================

const exclusions = [
  ["Amanda", "Nick Farmer"],
  ["Nick Farmer", "Amanda"],
  ["Mel", "Mark"],
  ["Mark", "Mel"]
];


// ======================================
// GENERATE DRAW
// ======================================

async function generateDraw() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "participants"
      )
    );

  const players = [];

  snapshot.forEach(
    (docSnap) => {

      const participant =
        docSnap.data();

      if (
        participant.role === "admin"
      ) {
        return;
      }

      players.push({
        id: docSnap.id,
        ...participant
      });

    }
  );

  let valid = false;
  let recipients = [];

  while (!valid) {

    recipients = [...players];

    recipients.sort(
      () => Math.random() - 0.5
    );

    valid = true;

    for (
      let i = 0;
      i < players.length;
      i++
    ) {

      const giver =
        players[i].name;

      const receiver =
        recipients[i].name;

      if (giver === receiver) {

        valid = false;
        break;

      }

      const prohibited =
        exclusions.some(
          (pair) =>
            pair[0] === giver &&
            pair[1] === receiver
        );

      if (prohibited) {

        valid = false;
        break;

      }

    }

  }

  for (
    let i = 0;
    i < players.length;
    i++
  ) {

    await setDoc(
      doc(
        db,
        "assignments",
        players[i].id
      ),
      {
        giver: players[i].name,
        recipient: recipients[i].name
      }
    );

    await updateDoc(
      doc(
        db,
        "participants",
        players[i].id
      ),
      {
        recipient:
          recipients[i].name
      }
    );

  }

  alert(
    "🎄 Secret Santa draw completed!"
  );

  await loadAdminDashboard();
}
