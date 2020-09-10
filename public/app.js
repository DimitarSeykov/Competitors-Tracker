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
let competitionsRef;
let resultsRef;
let unsubscribe;
let competitionsUnsubscribe;
let resultsUnsubscribe;

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
        competitionsRef = db.collection("competitions");
        resultsRef = db.collection("competitors_in_competitions");
        loggedUser = user;

        let team = teamsRef.where("uid", "==", loggedUser.uid);
        const registerTeam = document.getElementById("registerTeam");

        team.get().then(function(querySnapshot) {
            if (querySnapshot.empty) {
                registerTeam.hidden = false;
                userDetails.innerHTML = `<h3> Hello, ${user.displayName} ! </h3> <p> You must register a team! </p>`;
                whenRegisteredTeam.hidden = true;
                addTeamToDBButton.hidden = false;
            } else {
                registerTeam.hidden = true;
                let data = querySnapshot.docs[0].data();
                userDetails.innerHTML = `<h3> ${data.sports} team ${data.name} with coach ${data.coach} </h3>`;
                addTeamToDBButton.hidden = true;
                whenRegisteredTeam.hidden = false;
            }
        });
        listCompetitors();
        addCompetitionsToSelect();

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

const competitorName = document.getElementById("competitorName"),
      competitorBirthDate = document.getElementById("competitorBirthDate"),
      competitorStartYear = document.getElementById("competitorStartYear");

competitorName.onchange = makeUploadButtonVisible;
competitorBirthDate.onchange = makeUploadButtonVisible;
competitorStartYear.onchange = makeUploadButtonVisible;

function makeUploadButtonVisible(){
    if(competitorName.value && competitorBirthDate.value && competitorStartYear.value){
        document.getElementById("addCompetitorPhoto").hidden = false;
        document.getElementById("photoHolder").hidden = false;
    }
}

document.getElementById("registerCompetitorBtn").onclick = () => {
    clearFields();
}

function clearFields(){
    competitorName.value = "";
    competitorBirthDate.value = "";
    competitorStartYear.value = "";
    document.getElementById("addCompetitorPhoto").value = "";
    if(document.getElementById("currentPhoto")){
        document.getElementById("photoHolder").removeChild(document.getElementById("currentPhoto"));
    }

    document.getElementById("addCompetitorPhoto").hidden = true;
    document.getElementById("photoHolder").hidden = true;
}

const addCompetitorToDBBtn = document.getElementById("addCompetitorToDB");
let lastAddedPhotoUrl;
addCompetitorToDBBtn.onclick = addCompetititorToDB;

function addCompetititorToDB(){
    try{
        competitorsRef.add({
            coach_uid: loggedUser.uid,
            name: competitorName.value,
            birthDate: competitorBirthDate.value,
            startDate: competitorStartYear.value,
            photoUrl: lastAddedPhotoUrl
        });
        
        $("#modalRegisterCompetitor").modal('hide');
        listCompetitors();

    } catch(err){
        console.log(err);
    }    
}

var competitors = {};
var competitions = {};

function listCompetitors(){
    unsubscribe = competitorsRef
            .where('coach_uid', '==', loggedUser.uid)
            .orderBy('name')
            .onSnapshot(querySnapshot => {

                document.getElementById("competitorsSideNavNamesHolder").innerHTML = '';
                for(doc of querySnapshot.docs){
                    let listItem = document.createElement('li');
                    listItem.innerText = doc.data().name;
                    competitors[doc.data().name] = doc.data();
                    listItem.setAttribute('class', "listCompetitor");
                    document.getElementById("competitorsSideNavNamesHolder").appendChild(listItem);
                }

                document.querySelectorAll(".listCompetitor").forEach(item => {
                    item.onclick = displayCompetitorInfo;
                });

                loadCompetitorsToSelect();

            });
}

function loadCompetitorsToSelect(){
    let competitorSelect = document.getElementById("competitorNameResult");
    competitorSelect.innerHTML = '<option></option>';
    for(comp in competitors){
        let option = document.createElement("option");
        option.innerText = comp;
        competitorSelect.appendChild(option);
    }
}

function displayCompetitorInfo(){
    let name = this.innerText;
    $("#modalShowCompetitor").modal('show');
    document.getElementById("registeredCompetitorName").value = competitors[name].name;
    document.getElementById("registeredCompetitorBirthDate").value = competitors[name].birthDate;
    document.getElementById("registeredCompetitorStartYear").value = competitors[name].startDate;
    let photo = document.getElementById("registeredPhoto")
    photo.setAttribute("src", competitors[name].photoUrl);
    photo.setAttribute("height", "133px");
    photo.setAttribute("width", "100px");
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
        console.log(url);
        let img = document.createElement('img');
        img.setAttribute('src', url);
        img.setAttribute('width', "100px");
        img.setAttribute('height', "133px");
        img.setAttribute('id', "currentPhoto");
        document.getElementById("photoHolder").appendChild(img);
        lastAddedPhotoUrl = url;
    }).catch((err) => {console.log(err)});

    // TODO: track upload progress
});

document.getElementById("addCompetitionToDB").onclick = () => {
    let name = document.getElementById("competitionName").value,
        country = document.getElementById("competitionCountry").value,
        city = document.getElementById("competitionCity").value,
        startDate = document.getElementById("competitionStartDate").value,
        endDate = document.getElementById("competitionEndDate").value,
        venue = document.getElementById("competitionVenue").value,
        rank = document.getElementById("competitionRank").value;

        if(!endDate){
            endDate = startDate;
        }

        competitionsRef.add({
            coach_uid: loggedUser.uid,
            name: name, 
            country: country,
            city:city,
            startDate: startDate,
            endDate: endDate,
            venue: venue,
            rank: rank
        });


        $("#modalRegisterCompetition").modal('hide');
        addCompetitionsToSelect();

}

function addCompetitionsToSelect(){
    competitionsUnsubscribe = competitionsRef
            .where('coach_uid', '==', loggedUser.uid)
            .onSnapshot(querySnapshot => {

                document.getElementById("competitionResult").innerHTML = '<option></option>';
                for(doc of querySnapshot.docs){
                    //console.log(doc.data());
                    let selectItem = document.createElement('option');
                    selectItem.innerText = doc.data().name;
                    competitions[doc.data().name] = doc.data();
                    document.getElementById("competitionResult").appendChild(selectItem);
                }
            });
}


document.getElementById("addResultToDB").onclick = () => {
    let competitorName = document.getElementById("competitorNameResult").value,
        competitionName = document.getElementById("competitionResult").value,
        placement = document.getElementById("result").value;
    resultsRef.add({
        coach_uid: loggedUser.uid,
        competitorName: competitorName,
        competitionName: competitionName,
        placement: placement,
        date: competitions[competitionName].startDate
    });

    $("#modalRegisterResult").modal('hide');
}

document.getElementById("showFilters").onclick = () => {
    document.getElementById("filterName").innerHTML = document.getElementById("competitorNameResult").innerHTML;
    document.getElementById("filterCompetition").innerHTML = document.getElementById("competitionResult").innerHTML;
}

document.getElementById("filter").onclick = async () => {
    let name = document.getElementById("filterName").value,
        competition = document.getElementById("filterCompetition").value,
        from = document.getElementById("filterDateStart").value,
        to = document.getElementById("filterDateEnd").value;
    
    //console.log(from);
    let query = resultsRef;
    if(name){
        query = query.where('competitorName', '==', name);
        query = query.orderBy("competitorName");
    }
    if(competition){
        query = query.where('competitionName', '==', competition);
        query = query.orderBy("competitorName");
    }
    if(from){
        query = query.where('date', '>=', from);
    }
    if(to){
        query = query.where('date', '<=', to);
    }

    query = await query.get();
    if(query.empty){
        console.log("empty query");
    }
    document.getElementById("filteredResults").innerHTML = "";

    summary = {};

    query.forEach(doc => {
        let row = document.createElement("tr");
        let curName = doc.data().competitorName
        row.innerHTML = `<td>${curName}</td><td>${doc.data().placement}</td><td>${doc.data().competitionName}</td><td>${doc.data().date}</td>`
        document.getElementById("filteredResults").append(row);

        if(!summary[curName]){
            summary[curName] = {"1": 0, "2": 0, "3": 0, name: curName}
        }

        if(doc.data().placement <= 3){
            summary[curName][doc.data().placement]++;
        }
    });
    
    createSummary(toArray(summary));
    
}

function createSummary(summaryArr){
    summaryArr.sort(function(a, b){
        let costA = 7 * a["1"] + 3 * a["2"] + a["3"],
            costB = 7 * b["1"] + 3 * b["2"] + b["3"];
            return costA < costB;
    });

    document.getElementById("filterSummary").innerHTML = "";
    let gold = 0,
        silver = 0,
        bronze = 0;

    for(person of summaryArr){
        let row = document.createElement("tr");
        row.innerHTML = `<td>${person.name}</td><td>${person["1"]}</td><td>${person["2"]}</td><td>${person["3"]}</td>`
        document.getElementById("filterSummary").appendChild(row);
        gold += person["1"];
        silver += person["2"];
        bronze += person["3"];
    }
    let row = document.createElement("tr");
    row.innerHTML = `<td>Total </td><td>${gold}</td><td>${silver}</td><td>${bronze}</td>`;
    document.getElementById("filterSummary").appendChild(row);
}

function toArray(obj){
    let res = [];

    for(item in obj){
        res.push(obj[item]);
    }

    return res;
}

function openNav() {
    document.getElementById("competitorsSideNav").style.width = "250px";
}
  
function closeNav() {
    document.getElementById("competitorsSideNav").style.width = "0";
}