#!/usr/bin/env node

var shux = require('shux')();
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    default: { speed: 150 }
});
var through = require('through2');
var sh = shux.createShell('main', {
    command: [ 'bash', '-c', 'stty -echo; bash' ]
});
process.stdin.pipe(sh);

var spawn = require('child_process').spawn;
var ps = spawn('espeak',
    [ '-s', argv.speed ],
    { stdio: [ 'pipe', 'ignore', 'ignore' ] }
);
var c = sh.pipe(checker());
c.pipe(ps.stdin);
c.pipe(process.stdout);

function checker () {
    var prev = 0;
    return through(write);
    function write (buf, enc, next) {
        var t = shux.shells.main.terminal;
        var dbuf = t.displayBuffer;
        var cur = dbuf.cursorX + dbuf.cursorY * t.cols;
        if (cur > prev) {
            this.push(scan(prev, cur) + '\n');
        }
        prev = cur;
        next();
        
        function scan (i, j) {
            var output = [];
            for (var n = i; n < j; n++) output.push(get(n));
            return output.join('');
            
            function get (n) {
                var x = n % t.cols, y = Math.floor(n / t.cols);
                return dbuf.data[y][x][1];
            }
        }
    }
}
