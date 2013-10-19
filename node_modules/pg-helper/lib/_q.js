

module.exports =
    function _q(f) {
        if (/\s/.test(f)) {
            return "'" + f + "'";
        } else {
            return f;
        }
    }