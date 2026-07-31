const { hashPassword } = require("../utils/auth");

module.exports = async function (req, res, pathname, db, sendJSON, readBody, publicStudent) {

    if (pathname === "/api/login" && req.method === "POST") {

        const b = await readBody(req);

        const student = db.students.find(
            s => s.email.toLowerCase() === (b.email || "").toLowerCase()
        );

        if (!student || student.password !== hashPassword(b.password || "")) {
            return sendJSON(res, 401, {
                error: "Invalid email or password"
            });
        }

        return sendJSON(res, 200, {
            student: publicStudent(student)
        });

    }

    return false;

};