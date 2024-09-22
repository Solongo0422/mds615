var bucketName = "spi230624";
var bucketRegion = "ap-southeast-2";
var IdentityPoolId = "ap-southeast-2:1ab2afcc-1e97-4dce-b679-275381b1d0aa";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId,
  }),
});

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: {},
});

// Ene func bol tsugluulsan toonuud tservej hooson bolgodog. C tovch deer darahad duudagna.
function clearResult() {
  document.getElementById("result").innerHTML = "";
}

function clickNumber(num) {
  document.getElementById("result").innerHTML =
    document.getElementById("result").innerHTML + num;
}

function clickEquals() {
  try {
    document.getElementById("result").innerHTML = eval(
      document.getElementById("result").innerHTML
    );
  } catch (err) {
    document.getElementById("result").innerHTML = "Error";
  }
}

function showmenu(id) {
  document.getElementById("section1").style.display = "none";
  document.getElementById("section2").style.display = "none";
  document.getElementById("section3").style.display = "none";
  document.getElementById("section4").style.display = "none";
  document.getElementById(id).style.display = "block";

  if (id === "section2") {
    loadCalendar();
  } else if (id === "section3") {
    listMusic();
  }
}

const today = new Date();
function changeMonth(month) {
  today.setMonth(today.getMonth() + month);
  loadCalendar();
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function loadCalendar() {
  document.getElementById("current-month").innerHTML = `${
    monthNames[today.getMonth()]
  } ${today.getFullYear()}`;

  const current = new Date(today.getFullYear(), today.getMonth(), 1);
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const weekday = current.getDay();

  current.setDate(current.getDate() - weekday);

  let elemBody = document.getElementById("calendar-days");
  elemBody.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    let elemTR = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      let elemTD = document.createElement("td");
      if (current.getMonth() !== today.getMonth()) {
        elemTD.classList.add("inactive");
      }
      let elemDay = document.createElement("div");
      elemDay.innerHTML = current.getDate();
      elemDay.classList.add("day");
      if (today.getTime() == current.getTime()) {
        elemDay.classList.add("active");
      }
      elemTD.appendChild(elemDay);

      let todayStr = `${current.getFullYear()}-${
        current.getMonth() + 1
      }-${current.getDate()}`;
      let noteData = JSON.parse(
        localStorage.getItem(`calendar-note-${todayStr}`) || "[]"
      );
      noteData.forEach((n) => {
        let elemNote = document.createElement("div");
        elemNote.innerHTML = n;
        elemNote.classList.add("note");
        elemNote.onclick = function (e) {
          e.stopPropagation();
          if (
            confirm(`Note: ${n},\nAre you sure you want to delete the note?`)
          ) {
            localStorage.setItem(
              `calendar-note-${todayStr}`,
              JSON.stringify(noteData.filter((t) => t !== n))
            );
            loadCalendar();
          }
        };
        elemTD.appendChild(elemNote);
      });

      elemTD.onclick = function () {
        if (noteData.length >= 3) {
          alert(`You can add a maximum of 3 notes.`);
        } else {
          let msg = prompt("Enter your note");
          if (msg) {
            noteData.push(msg);
            localStorage.setItem(
              `calendar-note-${todayStr}`,
              JSON.stringify(noteData)
            );
            loadCalendar();
          }
        }
      };
      elemTR.appendChild(elemTD);

      current.setDate(current.getDate() + 1);
    }
    elemBody.appendChild(elemTR);
  }
}

function listMusic() {
  let elemUL = document.getElementById("playlist");
  elemUL.innerHTML = "loading...  ";
  s3.listObjects(
    {
      Bucket: `${bucketName}`,
      Prefix: "audios",
    },
    function (err, data) {
      elemUL.innerHTML = "";
      data["Contents"].forEach((content) => {
        const path = content["Key"];
        const split = path.split("/", 2);
        const name = split[1];
        if (name !== "") {
          let elemLI = document.createElement("li");

          let elemA = document.createElement("a");
          elemA.innerHTML = "x";
          elemA.onclick = function () {
            if (confirm(`Are you sure you want to delete '${name}'?`)) {
              s3.deleteObject(
                {
                  Bucket: bucketName,
                  Key: path,
                },
                (err) => {
                  if (err) {
                    console.error("Error deleting file:", err);
                    alert("An error occurred while deleting the file.");
                  }
                  listMusic();
                }
              );
            }
          };
          elemLI.appendChild(elemA);

          let elemSpan = document.createElement("span");
          elemSpan.innerHTML = name;

          elemLI.appendChild(elemSpan);

          elemLI.onclick = function () {
            let source = document.getElementById("source");
            source.src = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/audios/${name}`;

            let audio = document.getElementById("audio");
            audio.load();
            audio.play();

            elemUL.childNodes.forEach((e) => e.classList.remove("active"));
            elemLI.classList.add("active");
          };

          elemUL.appendChild(elemLI);
        }
      });
    }
  );
}

function addMusic() {
  const file = document.getElementById("fileToUpload").files[0];
  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  s3.putObject(
    {
      Bucket: bucketName,
      Key: `audios/${file.name}`,
      Body: file,
    },
    (err) => {
      if (err) {
        console.error("Error uploading file:", err);
        alert("An error occurred while uploading the file.");
      }
      listMusic();
    }
  );
}
