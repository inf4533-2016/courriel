
if (typeof forge === "undefined") {
  console.error(new Error("'node-forge' not found !"));
  forge = null;
} else {
  console.log("'node-forge' found.")
}

module.exports = forge;
