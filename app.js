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
