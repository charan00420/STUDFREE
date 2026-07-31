const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data.json");

function loadDB() {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveDB(db) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

module.exports = {
    loadDB,
    saveDB
};