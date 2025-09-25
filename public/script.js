const socket = io();
const alertsDiv = document.getElementById("alerts");
const alarmSound = document.getElementById("alarmSound");

socket.on("deposit", (data) => {
    const div = document.createElement("div");
    div.className = "alert";
    div.innerHTML = `🚨 New deposit detected! <br>
                     Txn: ${data.hash} <br>
                     Amount: ${data.amount}`;
    alertsDiv.prepend(div);

    // Play sound and show browser alert
    alarmSound.play();
    alert("🚨 New deposit received!");
});
