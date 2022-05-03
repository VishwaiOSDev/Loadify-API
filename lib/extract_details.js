// This function help you to extract certain details from a long object
module.exports = function extractDetailsFrom(object, keys) {
  return Object.keys(object)
    .filter(function (key) {
      return keys.indexOf(key) >= 0;
    })
    .reduce(function (acc, key) {
      acc[key] = object[key];
      return acc;
    }, {});
};
