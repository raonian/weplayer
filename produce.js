/**
 * 用于nodejs生成fragment mp4描述文件，便于用户点播视频时手动控制缓冲数据
 */

import fs from 'fs';
import Decoder from './src/js/decode';
import Encoder from './src/js/encode';

const rs = fs.createReadStream('./test/static/ssck.mp4');
let data = [];
rs.on('data', function(buf) {
    data.push(buf);
});
rs.on('end', function(){
    const res = Buffer.concat(data);
    let decoder = new Decoder();
    let result = decoder.parseBoxs(res, 0, res.length);
    console.log('box: ', result);

    let ws = fs.createWriteStream('./test/static/fragment.mp4');
    let encoder = new Encoder();
    let fragments = encoder.createFragmentedMP4(res, result);
    console.log('fragment create completed!');
    ws.write(Buffer.from(fragments.buffer));
});
