"use strict";

/**
 * conn query sql example:
 * conn.query("select * from users", (err, res, field) => {console.log(res);});
 */

var mysql = require("mysql");

module.exports = (conf) => {
  var conn = mysql.createConnection({
    // mysql connect info
    host: conf.host,
    user: conf.user,
    password: conf.password,
    database: conf.database
  });
  conn.connect();
  return conn;
};
