var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PJ5' });
});

//const cells = document.querySelectorAll('.-cell');

module.exports = router;
