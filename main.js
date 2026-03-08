const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) { 

    function convertToSeconds(time) {
        let parts = time.trim().split(" ");
        let clock = parts[0];
        let period = parts[1];

        let [h, m, s] = clock.split(":").map(Number);

        if (period === "pm" && h !== 12) h += 12;
        if (period === "am" && h === 12) h = 0;

        return h * 3600 + m * 60 + s;
    }

    let start = convertToSeconds(startTime);
    let end = convertToSeconds(endTime);

    let diff = end - start;

    let h = Math.floor(diff / 3600);
    let m = Math.floor((diff % 3600) / 60);
    let s = diff % 60;

    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {

    function convertToSeconds(time) {
        let parts = time.trim().split(" ");
        let clock = parts[0];
        let period = parts[1];

        let [h, m, s] = clock.split(":").map(Number);

        if (period === "pm" && h !== 12) h += 12;
        if (period === "am" && h === 12) h = 0;

        return h * 3600 + m * 60 + s;
    }

    let start = convertToSeconds(startTime);
    let end = convertToSeconds(endTime);

    let startLimit = 8 * 3600;
    let endLimit = 22 * 3600;

    let idle = 0;

    if (start < startLimit) idle += startLimit - start;
    if (end > endLimit) idle += end - endLimit;

    let h = Math.floor(idle / 3600);
    let m = Math.floor((idle % 3600) / 60);
    let s = idle % 60;

    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {

    function convertToSeconds(time) {
        let [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }

    let shift = convertToSeconds(shiftDuration);
    let idle = convertToSeconds(idleTime);

    let active = shift - idle;

    let h = Math.floor(active / 3600);
    let m = Math.floor((active % 3600) / 60);
    let s = active % 60;

    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
function metQuota(date, activeTime) {

    function convertToSeconds(time) {
        let [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }

    let active = convertToSeconds(activeTime);

    let quota = 8 * 3600 + 24 * 60; // normal quota

    let d = new Date(date);
    let month = d.getMonth() + 1;
    let day = d.getDate();

    if (month === 4 && day >= 10 && day <= 30) {
        quota = 6 * 3600; // Eid quota
    }

    return active >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    for (let line of lines) {
        let parts = line.split(",");

        if (parts[0] === shiftObj.driverID && parts[2] === shiftObj.date) {
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let met = metQuota(shiftObj.date, activeTime);

    let newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: met,
        hasBonus: false
    };

    let newLine = `${newRecord.driverID},${newRecord.driverName},${newRecord.date},${newRecord.startTime},${newRecord.endTime},${newRecord.shiftDuration},${newRecord.idleTime},${newRecord.activeTime},${newRecord.metQuota},${newRecord.hasBonus}`;

    fs.appendFileSync(textFile, "\n" + newLine);

    return newRecord;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {

        let parts = lines[i].split(",");

        if (parts[0] === driverID && parts[2] === date) {
            parts[9] = newValue.toString();
            lines[i] = parts.join(",");
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    let count = 0;
    let driverFound = false;

    month = parseInt(month); // convert "04" or "4" → 4

    for (let line of lines) {

        let parts = line.split(",");

        let id = parts[0];
        let date = parts[2];
        let bonus = parts[9].trim();

        if (id === driverID) {

            driverFound = true;

            let fileMonth = parseInt(date.split("-")[1]);

            if (fileMonth === month && bonus === "true") {
                count++;
            }
        }
    }

    if (!driverFound) return -1;

    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    let totalSeconds = 0;

    for (let line of lines) {

        let parts = line.split(",");

        let id = parts[0];
        let date = parts[2];
        let activeTime = parts[7];

        let fileMonth = parseInt(date.split("-")[1]);

        if (id === driverID && fileMonth == month) {

            let [h, m, s] = activeTime.split(":").map(Number);

            totalSeconds += h * 3600 + m * 60 + s;
        }
    }

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    let totalSeconds = 0;

    for (let line of lines) {

        let parts = line.split(",");

        let id = parts[0];
        let date = parts[2];

        let fileMonth = parseInt(date.split("-")[1]);

        if (id === driverID && fileMonth == month) {

            let quota = 8 * 3600 + 24 * 60;

            let d = new Date(date);
            let day = d.getDate();

            if (month === 4 && day >= 10 && day <= 30) {
                quota = 6 * 3600;
            }

            totalSeconds += quota;
        }
    }

    totalSeconds -= bonusCount * 2 * 3600;

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {

    function toSeconds(time) {
        let [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }

    let actual = toSeconds(actualHours);
    let required = toSeconds(requiredHours);

    let rateData = fs.readFileSync(rateFile, "utf8").trim().split("\n");

    let basePay = 0;
    let tier = 0;

    for (let line of rateData) {

        let parts = line.split(",");

        if (parts[0] === driverID) {
            basePay = parseInt(parts[2]);
            tier = parseInt(parts[3]);
        }
    }

    let allowed = {1:50, 2:20, 3:10, 4:3};

    let missing = Math.max(0, required - actual);

    let missingHours = Math.floor(missing / 3600);

    missingHours = Math.max(0, missingHours - allowed[tier]);

    let deductionRate = Math.floor(basePay / 185);

    let deduction = missingHours * deductionRate;

    return basePay - deduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
