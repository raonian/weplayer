import Decoder from './decode';
import Encoder from './encode';

export default class Weplayer {
    constructor(options, callback) {
        this.url = options.url;
        this.video = options.video;
        this.startRange = options.startRange || '';
        this.autoPlay = options.autoPlay || false;
        this.range = '0-' + this.startRange;
        this.loadedSize = 0;
        this.parseIndex = 0;
        this.cb = callback;
    
        this.init();
    }
    init() {
        let ms = new MediaSource();
        let mimeCode = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        this.video.src = window.URL.createObjectURL(ms);
        ms.addEventListener('sourceopen', sourceOpen);
        let t = this;
        function sourceOpen() {
            let ms = this;
            let buffer = ms.addSourceBuffer(mimeCode);
            buffer.addEventListener('updateend', function(){
                // buffer.timestampOffset = buffer.buffered.end(1);
                // loadVideo();
                ms.endOfStream();
                // t.video.currentTime = 0.2;
                console.log(buffer.buffered.start(0))
                console.log(buffer.buffered.end(0))
                // if(i==ranges.length) ms.endOfStream();
                // t.cb();
            })
            
            getVideo(function(xhr){
                let response = xhr.response;
                t.loadedSize += response.length;
                let buf = new Uint8Array(response);
                // console.log('buf------', buf);
                
                // ms.endOfStream();
                let decoder = new Decoder();
                let result = decoder.parseBoxs(buf, t.parseIndex, response.byteLength);
                console.log(result, 'box');
                let encoder = new Encoder();
                let fragments = encoder.createFragmentedMP4(buf, result);
                buffer.appendBuffer(fragments.buffer);
                // buffer.appendBuffer(buf);
            })
            
        }
        function getVideo(cb) {
            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
                cb(xhr);
            }
            xhr.open('get', t.url);
            xhr.setRequestHeader('Range', 'bytes=' + t.range);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
        }
        this.video.onload = function(e) {
            // window.URL.revokeObjectURL(t.video.src);
        };
    }
    play() {
        // this.video.play();
    }
}