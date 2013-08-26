var bcrypt = require('bcrypt');

exports.cryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

exports.comparePassword = function(password, userPassword, callback) {
   bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
      if (err) return callback(err);
      else return callback(null, isPasswordMatch);
   });
};

exports.token = function () {
  // genera una cadena aleatoria alfanumerica
  return (new Buffer(bcrypt.hashSync(Math.random().toString(36) + Date.now(36).toString(), bcrypt.genSaltSync(10)))).toString('base64');
}