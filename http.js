var http = require('http');
var fs = require('fs');
var url = require('url');
var WebSoket = require('ws').Server;

var wss = new WebSoket({port: 8088});
wss.on('connection', function connection(ws){
    ws.on('message', function incoming(message) {
        console.log('mes');
    });
    // ws.send('connection');
    var rs = fs.createReadStream('./oceans.mp4');
    var data = '';
    rs.on('data', function(d) {
        ws.send(new Buffer(d));
    });
    rs.on('end', function(){
        ws.send('end');
        ws.close();
    });

});

var server = http.createServer(function(req, res){
    var pathname = url.parse(req.url).pathname;
    var filepath = './index.html';
    var contentType = 'text/html';
    if(pathname.match('.mp4')) {
        contentType = 'video/mp4'; // 'text/event-stream';
        filepath = './' + pathname;
    }
    
    var stat = fs.statSync(filepath);
    var fileLength = stat.size;


res.writeHead(200, {
            'Cache-Control': 'no-cache',
            'Content-Type': contentType//,
            // 'Content-Length': fileLength,
            // 'Content-Range': 'bytes 0-' + (fileLength - 1) +'/' + fileLength
        });

    /*if(pathname.match('.html')){
        var rs = fs.createReadStream(filepath).pipe(res);
    }else {
        res.write('data: hello');
        res.end('\n\n');
    }*/

    var rs = fs.createReadStream(filepath);
    var data = '';
    var array = [];
    rs.on('data', function(d) {
        data += d;
        array.push(new Buffer(d));
        /*res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': d.length,
            'Content-Rang': 'bytes 0-' + (fileLength - 1) +'/' + fileLength
        });
        rs.pipe(res);*/
    });
    rs.on('end', function(){
        if(pathname.match('.mp4')){
            res.write(Buffer.concat(array));
        }else {
            res.write(data);
        }
        res.end('\n\n');
    })
});

server.listen(8888,function(){
    console.log('----------------:',server.address().port);
});