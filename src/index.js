import Weplayer from './js/weplayer';

let video = document.getElementById('my-video');
let weplayer = new Weplayer({
    url: '/static/video/oceans.mp4',
    video: video
}, function() {
    // this.play();
});