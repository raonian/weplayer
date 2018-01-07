import Weplayer from './js/weplayer';

let video = document.getElementById('my-video');
let weplayer = new Weplayer({
    url: '/static/video/paper.mp4',
    video: video
}, function() {
    // this.play();
});