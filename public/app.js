const auth = firebase.auth();
const db = firebase.firestore();

const whenSignedIn = document.getElementById("whenSignedIn");
const whenSignedOut = document.getElementById("whenSignedOut");

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");

const userDetails = document.getElementById("userDetails");
const teamsList = document.getElementById("teamsList");

const provider = new firebase.auth.GoogleAuthProvider();
let teamsRef;
let unsubscribe;

signInBtn.onclick = () => auth.signInWithPopup(provider);

signOutBtn.onclick = () => auth.signOut();

let loggedUser;

auth.onAuthStateChanged(user => {
    if(user) {
        //signed in 
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3> Hello, ${user.displayName} ! </h3>`;

        teamsRef = db.collection("teams");
        loggedUser = user;

        let team = teamsRef.where("uid", "==", loggedUser.uid);
        const registerTeam = document.getElementById("registerTeam");

        team.get().then(function(querySnapshot) {
            if (querySnapshot.empty) {
                registerTeam.hidden = false;
            } else {
                registerTeam.hidden = true;
                //userDetails.innerHTML += ""
                console.log(querySnapshot.docs[0].data());
            }
        });

        /*
        unsubscribe = teamsRef
            .where("uid", "==", loggedUser.uid)
            .onSnapshot(querySnapshot => {
        const items = querySnapshot.docs.map(doc => {
            return `<li>${ doc.data().name } ${doc.data().sports} </li>`
        });

        teamsList.innerHTML = items.join("");
    });
    */

    } else {
        //not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = '';
    }
});

const addToDBButton = document.getElementById("addToDB");

addToDBButton.onclick = () => addToDB();

function addToDB(){
    let name = document.getElementById("name");
    let sports = document.getElementById("sports");
    let coach = document.getElementById("coach");

    if(name.value.length > 0 && sports.value.length > 0 && coach.value.length > 0){
        //console.log(name.value + " " + sports.value);
        teamsRef.add({
            uid: loggedUser.uid,
            name: name.value,
            sports: sports.value,
            coach: coach.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        registerTeam.hidden = true;
    } else {
        console.log("error");
    }
}

