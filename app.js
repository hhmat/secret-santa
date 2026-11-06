const ADMIN_EMAIL =
"admin@ttrnottingham.com";

import {
 auth,
 db
}
from "./firebase-config.js";

import {
 createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 signOut,
 onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
 doc,
 setDoc,
 getDoc,
 updateDoc
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

document
.getElementById(
"registerBtn"
)
.addEventListener(
"click",
registerUser
const settingsRef =
doc(
 db,
 "settings",
 "event"
);

const settingsSnap =
await getDoc(
 settingsRef
);

if(
 settingsSnap.exists()
 &&
 settingsSnap.data()
 .registrationOpen === false
){

 alert(
 "Registration closed"
 );

 return;

}
);

document
.getElementById(
"loginBtn"
)
.addEventListener(
"click",
loginUser
);

async function registerUser(){

 const name =
 document.getElementById(
 "name"
 ).value;

 const email =
 document.getElementById(
 "email"
 ).value;

 const password =
 document.getElementById(
 "password"
 ).value;

 const wishlist =
 document
 .getElementById(
 "wishlist"
 )
 .value
 .split("\n")
 .filter(Boolean);

 try{

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
  role:"participant",
  wishlist,
  rsvp:true,
  recipient:"",
  giftStatus:
   "Not Started"
 }
 );

 alert(
 "Registration successful"
 );

 }catch(error){

  alert(error.message);

 }

}

async function loginUser(){

 const email =
 document.getElementById(
 "loginEmail"
 ).value;

 const password =
 document.getElementById(
 "loginPassword"
 ).value;

 try{

 await signInWithEmailAndPassword(
 auth,
 email,
 password
 );

 }catch(error){

 alert(error.message);

 }

}

onAuthStateChanged(
 
 if(user.email === ADMIN_EMAIL){

 loadAdminDashboard();

}
 auth,
 async(user)=>{

 if(!user){

 return;

 }

 document
 .getElementById(
 "authCard"
 )
 .classList.add(
 "hidden"
 );

 document
 .getElementById(
 "dashboard"
 )
 .classList.remove(
 "hidden"
 );

 const snapshot =
 await getDoc(
 doc(
 db,
 "participants",
 user.uid
 )
 );

 const data =
 snapshot.data();

 document
 .getElementById(
 "userName"
 )
 .textContent =
 data.name;

 document
 .getElementById(
 "wishlistEdit"
 )
 .value =
 data.wishlist.join("\n");

 document
 .getElementById(
 "rsvp"
 )
 .value =
 data.rsvp.toString();

});

document
.getElementById(
"logoutBtn"
)
.addEventListener(
"click",
()=>signOut(auth)
);

async function saveWishlist(){

 const user =
 auth.currentUser;

 const wishlist =
 document
 .getElementById(
 "wishlistEdit"
 )
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

 alert(
 "Wishlist updated"
 );
}

document
.getElementById(
"saveWishlistBtn"
)
.addEventListener(
"click",
saveWishlist
);

async function saveRsvp(){

 const user =
 auth.currentUser;

 const rsvp =
 document
 .getElementById(
 "rsvp"
 )
 .value === "true";

 await updateDoc(
 doc(
 db,
 "participants",
 user.uid
 ),
 {
   rsvp
 });

 alert(
 "RSVP updated"
 );
}

document
.getElementById(
"saveRsvpBtn"
)
.addEventListener(
"click",
saveRsvp
);

import {
 collection,
 getDocs
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

async function loadAdminDashboard(){

 document
 .getElementById("adminPanel")
 .classList.remove("hidden");

 const participantsSnapshot =
 await getDocs(
 collection(
 db,
 "participants"
 )
 );

 const participants=[];

 participantsSnapshot.forEach(
 doc=>{
  participants.push(
   doc.data()
  );
 });

 document
 .getElementById(
 "participantCount"
 )
 .textContent=
 participants.length;

 let html="";

 participants.forEach(
 p=>{

 html += `
 <div>
 ${p.name}
 (${p.rsvp ? '✅':'❌'})
 </div>
 `;

 });

 document
 .getElementById(
 "participantList"
 )
 .innerHTML=
 html;

}

import {
 getDoc,
 setDoc
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

document
.getElementById(
"saveBudgetBtn"
)
.addEventListener(
"click",
saveBudget
);

async function saveBudget(){

 const budget=
 Number(
 document
 .getElementById(
 "budgetInput"
 )
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
  merge:true
 }
 );

 alert(
 "Budget updated"
 );

}

document
.getElementById(
"toggleRegistrationBtn"
)
.addEventListener(
"click",
toggleRegistration
);

async function toggleRegistration(){

 const settingsRef =
 doc(
 db,
 "settings",
 "event"
 );

 const settingsSnap =
 await getDoc(
 settingsRef
 );

 const current =
 settingsSnap.data()
 .registrationOpen;

 await setDoc(
 settingsRef,
 {
  registrationOpen:
  !current
 },
 {
  merge:true
 }
 );

 alert(
 "Registration updated"
 );

}

document
.getElementById(
"generateDrawBtn"
)
.addEventListener(
"click",
generateDraw
);

const exclusions = [

 ["Amanda","Nick Farmer"],
 ["Nick Farmer","Amanda"],

 ["Mel","Mark"],
 ["Mark","Mel"]

];

async function generateDraw(){

 const snapshot =
 await getDocs(
 collection(
 db,
 "participants"
 )
 );

 const players=[];

 snapshot.forEach(
 d=>{

  players.push({

   id:d.id,

   ...d.data()

  });

 });

 let valid=false;

 let recipients=[];

 while(!valid){

  recipients=
  [...players];

  recipients.sort(
   ()=>Math.random()-0.5
  );

  valid=true;

  for(
   let i=0;
   i<players.length;
   i++
  ){

   const giver =
   players[i].name;

   const receiver =
   recipients[i].name;

   if(
    giver === receiver
   ){

    valid=false;
    break;

   }

   const prohibited =
   exclusions.some(
    pair=>

    pair[0]===giver &&
    pair[1]===receiver

   );

   if(prohibited){

    valid=false;
    break;

   }
  }
 }

 for(
  let i=0;
  i<players.length;
  i++
 ){

  await setDoc(

   doc(
    db,
    "assignments",
    players[i].id
   ),

   {

    giver:
    players[i].name,

    recipient:
    recipients[i].name

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
 "Draw completed!"
 );

}

if(data.recipient){

 document
 .getElementById(
 "recipient"
 )
 .textContent =
 data.recipient;

}
