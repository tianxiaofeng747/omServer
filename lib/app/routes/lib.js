/**
 * Created by jiping on 15/6/6.
 */
var fs = require('fs');
var express = require('express');
var ENV = require('../../util/env');

var router = express.Router();

router.get('/:name', function (req, res) {
    try {
        var filePath = ENV.base_path + '/lib/' + req.params.name;
        res.sendFile(filePath);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
module.exports = router;