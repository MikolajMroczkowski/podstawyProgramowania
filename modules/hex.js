class hexHelper{
    str2hex(str)
    {
        var arr1 = [];
        for (var n = 0, l = str.length; n < l; n ++)
        {
            var hex = Number(str.charCodeAt(n)).toString(16);
            arr1.push(hex);
        }
        return arr1.join('');
    }
    hex2str(hex) {
        var hexx = hex.toString();//force conversion
        var str = '';
        for (var i = 0; i < hexx.length; i += 2)
            str += String.fromCharCode(parseInt(hexx.substr(i, 2), 16));
        return str;
    }
}
module.exports = hexHelper