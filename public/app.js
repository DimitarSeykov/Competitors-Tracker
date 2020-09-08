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
let competitorsRef;
let unsubscribe;

signInBtn.onclick = () => auth.signInWithPopup(provider);

signOutBtn.onclick = () => auth.signOut();

let loggedUser;
const whenRegisteredTeam = document.getElementById("whenRegisteredTeam");

auth.onAuthStateChanged(user => {
    if(user) {
        //signed in 
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;

        teamsRef = db.collection("teams");
        competitorsRef = db.collection("competitors");
        loggedUser = user;

        let team = teamsRef.where("uid", "==", loggedUser.uid);
        const registerTeam = document.getElementById("registerTeam");

        team.get().then(function(querySnapshot) {
            if (querySnapshot.empty) {
                registerTeam.hidden = false;
                userDetails.innerHTML = `<h3> Hello, ${user.displayName} ! </h3> <p> You must register a team! </p>`;
                whenRegisteredTeam.hidden = true;
            } else {
                registerTeam.hidden = true;
                let data = querySnapshot.docs[0].data();
                userDetails.innerHTML = `<h3> ${data.sports} team ${data.name} with coach ${data.coach} </h3>`;
                addTeamToDBButton.hidden = true;
                whenRegisteredTeam.hidden = false;
            }
        });

    } else {
        //not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        whenRegisteredTeam.hidden = true;
        userDetails.innerHTML = '';
    }
});

const addTeamToDBButton = document.getElementById("addTeamToDB");

addTeamToDBButton.onclick = () => addTeamToDB();

function addTeamToDB(){
    let name = document.getElementById("name").value;
    let sports = document.getElementById("sports").value;
    let coach = document.getElementById("coach").value;

    if(name.length > 0 && sports.length > 0 && coach.length > 0){
        //console.log(name.value + " " + sports.value);
        teamsRef.add({
            uid: loggedUser.uid,
            name: name,
            sports: sports,
            coach: coach,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        registerTeam.hidden = true;
        userDetails.innerHTML = `<h3> ${sports} team ${name} with coach ${coach} </h3>`;
        addTeamToDBButton.hidden = true;
        whenRegisteredTeam.hidden = false;
    } else {
        console.log("error");
    }
}

const addCompetitorToDBBtn = document.getElementById("addCompetitorToDB");
let lastAddedPhotoUrl;
addCompetitorToDBBtn.onclick = addCompetititorToDB;

function addCompetititorToDB(){
    try{
        let competitorName = document.getElementById("competitorName").value
        let birthDate = document.getElementById("competitiorBirthDate").value;
        let startDate = document.getElementById("competitorStartYear").value;
        competitorsRef.add({
            coach_uid: loggedUser.uid,
            name: competitorName,
            birthDate: birthDate,
            startDate: startDate,
            photoUrl: lastAddedPhotoUrl
        });
        
        $("#modalRegisterCompetitor").modal('hide');
    } catch(err){
        console.log(err);
    }    
}

const addCompetitorPhotoButton = document.getElementById("addCompetitorPhoto");

addCompetitorPhotoButton.addEventListener("change", async (e) => {
    let file = e.target.files[0];
    let competitorName = document.getElementById("competitorName").value
    let fileName = loggedUser.uid + "_" + competitorName;
    file.name = fileName;
    let fullName = "images/" + fileName;
    let storageRef = firebase.storage().ref(fullName);
    await storageRef.put(file);

    storageRef.getDownloadURL().then(function(url) {
        let img = document.createElement('img');
        img.setAttribute('src', url);
        img.setAttribute('width', "100px");
        img.setAttribute('height', "133px");
        document.getElementById("photoHolder").appendChild(img);
        lastAddedPhotoUrl = url;
    }).catch((err) => {console.log(err)});

    // TODO: track upload progress
});


function openNav() {
    document.getElementById("competitorsSideNav").style.width = "250px";
}
  
function closeNav() {
    document.getElementById("competitorsSideNav").style.width = "0";
}