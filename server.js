const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Your Neo X wallet address to track
const ADDRESS = "0x11c5fE402fd39698d1144AD027A2fF2471d723af";

// xExplorer Neo X API URL for transactions
const API_URL = `https://xexplorer.neo.org/api/v2/addresses/${ADDRESS}/transactions`;

// Set of seen transaction hashes to avoid duplicate alerts
let seenTxHashes = new Set();

// Polling interval (milliseconds)
const CHECK_INTERVAL = 15000; // 15 seconds

// Serve static frontend files from 'public' folder
app.use(express.static("public"));

// Function to check transactions for new deposits
async function checkTransactions() {
    try {
        const res = await axios.get(API_URL, { timeout: 10000 });
        const data = res.data;

        // xExplorer API usually returns transactions in data.items
        const txns = data.items || data.data || [];

        for (let tx of txns) {
            const hash = tx.hash;
            
            // Extract actual recipient address safely
            let toHash = null;
            if (tx.to && typeof tx.to === "object" && tx.to.hash) {
                toHash = tx.to.hash;
            } else if (typeof tx.to === "string") {
                toHash = tx.to;
            }

            const amount = tx.value || tx.amount || "unknown";

            // Only alert if this is a new transaction to our address
            if (!seenTxHashes.has(hash)) {
                seenTxHashes.add(hash);

                if (toHash && toHash.toLowerCase() === ADDRESS.toLowerCase()) {
                    console.log("🚨 New deposit detected:", hash, "Amount:", amount);
                    io.emit("deposit", { hash, amount });
                }
            }
        }

    } catch (err) {
        console.error("Error fetching transactions:", err.message);
    }
}

// Repeat the check every CHECK_INTERVAL milliseconds
setInterval(checkTransactions, CHECK_INTERVAL);

// Handle frontend Socket.IO connections
io.on("connection", (socket) => {
    console.log("✅ Frontend connected");
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
