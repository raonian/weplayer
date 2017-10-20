/* 生成 fragments mp4 */
/**
 * fragments mp4格式编码
 * @description fragments mp4格式与mp4格式相似，不同之处在于moof box
 * @author 饶念
 */
'use strict';

var fragments = [];
var flexlen = 0;
var containBox = {};
var resultFrag = [];
var moofs = [];
var samples = [];
var traks = {};
var trakIds = [];
var durations = {};
var keyframes = [];
var cttss = [];
var timeoffsets = [];
var chunks = [];
var sequence = [];
var offsets = [];
var baseDataOffset = 0;
var metaDataOffset = 8;
var mdats = [];
var samplePerChunk = {};
var keyFrameChunks = {};
var baseBuffer = [];
var fragmentBuffer = [];
var mfras = [];
var moofOffsets = [];
var mduration = 0;
var fragmentMdats = [];
var videoTrack = [];
var mvex = {
    size: 72,
    type: 'mvex',
    // buffer: [0, 0, 0, 72, 109, 118, 101, 120],
    children: [
        // {
        //     size: 16,
        //     type: 'mehd',
        //     buffer: [0, 0, 0, 16, 109, 101, 104, 100, 0, 0, 0, 0, ...createSize(mduration)]
        // },
        {
            size: 32,
            type: 'trex',
            buffer: [0, 0, 0, 32, 116, 114, 101, 120, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            size: 32,
            type: 'trex',
            buffer: [0, 0, 0, 32, 116, 114, 101, 120, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};
const creater = {
    'ftyp': function(source) {
        let ary = Array.from(source);
        ary.splice(-4, 0, ...[105, 115, 111, 54]);
        // ary.splice(8, 4, 109, 112, 52, 50);
        ary.splice(0, 4, ...createSize(ary.length));
        // ary.splice(12, 4, 0, 0, 2, 0);
        return ary;

        // return [0, 0, 0, 28, 102, 116, 121, 112, 109, 112, 52, 50, 0, 0, 0, 1, 109, 112, 52, 50, 97, 118, 99, 49, 105, 111, 115, 53];
    },
    'mvhd': function(source, box) {
        let mvhds = Array.from(source);
        mvhds.splice(24, 4, 0, 0, 0, 0);
        // mvhds.splice(-4, 4, 0, 0, 0, 2);
        mduration = box.duration;
        return mvhds;
    },
    'tkhd': function(source, box) {
        traks.trakId = box.trak_ID;
        trakIds.push(box.trak_ID);
        
        let mvhds = Array.from(source);
        mvhds.splice(20, 4, ...createSize(box.trak_ID));
        mvhds.splice(28, 4, 0, 0, 0, 0);
        // mvhds.splice(-8, 8, 0, 0, 0, 0, 0, 0, 0, 0);
        
        return mvhds;
        // return Array.from(source);
    },
    'edts': function(source, box) {
        return [];
    },
    'mdhd': function(source, box) {
        traks.duration = box.duration;
        traks.timescale = box.timescale;
        durations[traks.trakId] = box.duration;

        let mvhds = Array.from(source);
        mvhds.splice(24, 4, 0, 0, 0, 0);
        // mvhds.splice(-4, 2, 21, 199);
        return mvhds;
        // return Array.from(source);
    },
    'hdlr': function(source, box) {
        traks.handlerType = box.handler_type;

        return Array.from(source);
    },
    'vmhd': function(source) {
        return Array.from(source);
    },
    'smhd': function(source) {
        return Array.from(source);
    },
    'dref': function(source, box) {
        return Array.from(source);
    },
    'avc1': function(source, box) {
        // let newAvc = Array.from(source);
        // newAvc.splice(-15, 2, 0, 0);
        // return newAvc;
        return Array.from(source);
    },
    'mp4a': function(source, box) {
        // let newMp4 = [0, 0, 0, 90, 109, 112, 52, 97, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 16, 0, 0, 0, 0, 172, 68, 0, 0, 0, 0, 0, 54, 101, 115, 100, 115, 0, 0, 0, 0, 3, 128, 128, 128, 37, 0, 2, 0, 4, 128, 128, 128, 23, 64, 21, 0, 0, 0, 0, 1, 244, 0, 0, 0, 0, 0, 5, 128, 128, 128, 5, 18, 16, 86, 229, 0, 6, 128, 128, 128, 1, 2];
        // return newMp4;
        return Array.from(source);
    },
    'stts': function(source, box) {
        let newSize = createSize(16);
        let newBuf = Array.from(source).slice(4, 8);
        newBuf = newSize.concat(newBuf.concat(new Array(8).fill(0)));

        sequence = [];
        box.entry.map(function(o) {
            sequence.push({sampleCount: o.sample_count, sampleDelta: o.sample_delta});
        });
        
        return newBuf;
    },
    'stss': function(source, box) {
        keyframes = [];
        box.entry.map(function(o) {
            keyframes.push(o.sample_number);
        });
        
        return [];
    },
    'ctts': function(source, box) {
        cttss = [];
        box.entry.map(function(o) {
            cttss.push({sampleCount: o.sample_count, sampleOffset: o.sample_offset});
        });
        for(let i = 0, j = 1; i < cttss.length;) {
            const {sampleCount, sampleOffset} = cttss[i];
            if(j === sampleCount) {
                i++;
                j = 1;
            }else {
                j++;
            }
            timeoffsets.push(sampleOffset);
            // timeoffsets
        }
        
        return [];
    },
    'stsc': function(source, box) {
        chunks[traks.trakId] = [];
        // samplePerChunk[traks.trakId] = [];
        box.entry.map(function(o) {
            chunks[traks.trakId].push({
                firstChunk: o.first_chunk,
                sampleDescriptionIndex: o.sample_description_index,
                samplePerChunk: o.samples_per_chunk
            });
            // samplePerChunk[traks.trakId].push(o.samples_per_chunk);
        })
        
        return [0, 0, 0, 16, 115, 116, 115, 99, 0, 0, 0, 0, 0, 0, 0, 0];
    },
    'stsz': function(source, box) {
        samples[traks.trakId] = [];
        box.entry.map(function(o) {
            samples[traks.trakId].push(o.entry_size);
        });
        return [0, 0, 0, 20, 115, 116, 115, 122, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    },
    'stco': function(source, box) {
        offsets[traks.trakId] = [];
        box.entry.map(function(o) {
            offsets[traks.trakId].push(o.chunk_offset);
        });
        fillSamplePerChunk();
        return [0, 0, 0, 16, 115, 116, 99, 111, 0, 0, 0, 0, 0, 0, 0, 0];
    },
    'udta': function(source, box) {
        const {size, type, value} = box;
        let values = Array.from(value);
        values[93 - 8]--;
        values[97 - 8]++;
        return [...createSize(size), ...createType(type), ...values];
        // return [];
    },
    'free': function(source) {
        return [];
    },
    'mdat': function(source, box) {
        createMdat(source);
        keyframes.slice(0, -1).map(function(n, i) {
            createMoof(n, i);
        });

        createMfra();
    }
};
function getSampleKeyIndex(trakid, i) {
    let chunk = keyFrameChunks[trakid];
    let index = 0;
    for(let j = 0; j < chunk.length; j++) {
        if(i === j) {
            return index;
        }
        index += chunk[j].length;
    }
}
function createMoof(n, i) {
    // console.log(createSamples(source, count, 1)); return;
    const count = keyFrameChunks['1'][i].length;
    const counts = keyFrameChunks['2'][i].length;
    let fragsample = createSamples(getSampleKeyIndex(1, i), i, count, 1);
    let fragsamples = createSamples(getSampleKeyIndex(2, i), i, counts, 2);
    // let soundsample = createSamples(n, source, count, 2);
    let fragsize = fragsample.reduce(function(a, b){return a + b.buffer.length}, 0);
    let fragsizes = fragsamples.reduce(function(a, b){return a + b.buffer.length}, 0);
    let soundflags = [0, 0, 3, 1];
    if(i > 0 && i < 20) {
        soundflags = [0, 0, 2, 1];
    }else {
        soundflags = [0, 0, 3, 1];
    }
    let soundDuration = 4856;
    if(i > 0) {
        soundDuration = 1024;
    }
    // console.log(baseDataOffset);
    // console.log(fragsample[0].sample_size, fragsamples[0].sample_size)
    // console.log(fragsamples.reduce(function(a, b){return a.concat(b.buffer)}, []))
    moofOffsets.push(baseDataOffset);
    let precount = n - 1;
    let precounts = getSampleKeyIndex(2, i);
    let timeoffset = precounts * 1024;
    // console.log(precounts, precounts * 1024);
    if(i === 1) {
        timeoffset = (precounts - 1) * 1024 + 4856; // to update
    }else if(i === 20) {
        timeoffset = (precounts - 1) * 1024 + 2765;
    }
    // fragmentMdats.push(fragsample.reduce(function(a, b){return a + b.sample_size}, 0) + fragsamples.reduce(function(a, b){return a + b.sample_size}, 0));
    let moof = {
        size: 176,
        type: 'moof',
        children: [
            {
                size: 16,
                type: 'mfhd',
                sequence_number: i + 1,
                buffer: [0, 0, 0, 16, 109, 102, 104, 100, 0, 0, 0, 0, ...createSize(i + 1)]
            },
            {
                size: 80,
                type: 'traf',
                children: [
                    {
                        size: 28,
                        type: 'tfhd',
                        trak_ID: 1,
                        base_data_offset: baseDataOffset,
                        // sample_description_index: 1,
                        default_sample_duration: 1024,
                        // default_sample_size: keyFrameChunks['1'][i][0],
                        default_sample_size: fragsample[0].sample_size,
                        buffer: [
                            0, 0, 0, 28, 116, 102, 104, 100, 0, 2, 0, 56,
                            0, 0, 0, 1, 
                            // ...createSize(baseDataOffset, 8), 
                            // 0, 0, 0, 1,
                            ...createSize(1024), 
                            ...createSize(fragsample[0].sample_size),
                            1, 1, 0, 0
                        ],
                        default_sample_flags: {
                            reserved: 0,
                            is_leading: 0,
                            sample_depends_on: true, //
                            sample_is_depended_on: false,
                            sample_has_redundancy: false,
                            sample_padding_value: 0,
                            sample_is_non_sync_sample: true,
                            sample_degradation_priority: 128,
                            buffer: [1, 1, 0, 0]
                        }
                    },
                    {
                        size: 20,
                        type: 'tfdt',
                        buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...createSize(precount*1024, 8)]
                        // buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    },
                    {
                        size: 24,
                        type: 'trun',
                        sample_count: count,
                        data_offset: 0,
                        first_sample_flags: [2, 0, 0, 0],
                        samples: fragsample,
                        buffer: [
                            ...createSize(fragsize + 24), 116, 114, 117, 110, 
                            0, 0, 10, 5,
                            ...createSize(count), ...createSize(fragsize),
                            2, 0, 0, 0, 
                            ...fragsample.reduce(function(a, b){return a.concat(b.buffer)}, [])
                        ]
                    }
                ]
            },
            {
                size: 72,
                type: 'traf',
                children: [
                    {
                        size: 24,
                        type: 'tfhd',
                        trak_ID: 2,
                        base_data_offset: baseDataOffset,
                        // sample_description_index: 1,
                        default_sample_duration: 1024,
                        // default_sample_size: keyFrameChunks['2'][i][0],
                        default_sample_size: fragsamples[0].sample_size,
                        buffer: [
                            0, 0, 0, 24, 116, 102, 104, 100, 0, 2, 0, 24,
                            0, 0, 0, 2, 
                            // ...createSize(baseDataOffset, 8), 
                            // 0, 0, 0, 1,
                            ...createSize(soundDuration), 
                            ...createSize(fragsamples[0].sample_size),
                            // 2, 0, 0, 0
                        ],
                        default_sample_flags: {
                            reserved: 0,
                            is_leading: 0,
                            sample_depends_on: true,
                            sample_is_depended_on: false,
                            sample_has_redundancy: false,
                            sample_padding_value: 0,
                            sample_is_non_sync_sample: true,
                            sample_degradation_priority: 128,
                            buffer: [2, 0, 0, 0]
                        }
                    },
                    {
                        size: 20,
                        type: 'tfdt',
                        buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...createSize(precounts*1024, 8)]
                        // buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    },
                    {
                        size: 20,
                        type: 'trun',
                        sample_count: counts,
                        data_offset: 0,
                        // first_sample_flags: [0, 0, 1, 0],
                        samples: fragsamples,
                        buffer: [
                            ...createSize(fragsizes + 20), 116, 114, 117, 110,
                            // ...soundflags,
                            0, 0, 3, 1,
                            ...createSize(counts), ...createSize(fragsizes),
                            // [0, 0, 1, 0],
                            ...fragsamples.reduce(function(a, b){return a.concat(b.buffer)}, [])
                        ]
                    }
                ]
            }
        ]
    }

    
    // update moof
    let trafid = 0;
    let trunVideo = null;
    function updateMoofSize(box) {
        box.map(function(o) {
            const {size, type, children} = o;
            if(type === 'traf') {
                trafid++;
            }
            if(type === 'trun') {
                o.size = o.buffer.length;
                if(trafid === 1) {
                    trunVideo = o;
                }
                if(trafid === 2) {
                    // let mdatVideoOffset = keyFrameChunks['1'][i].reduce(function(a, b){return a + b}, 0);
                    let mdatVideoOffset = trunVideo.samples.reduce(function(a, b){return a + b.sample_size}, 0);
                    trunVideo.data_offset = moof.size + 8;
                    trunVideo.buffer.splice(16, 4, ...createSize(trunVideo.data_offset));
                    o.data_offset = moof.size + 8 + mdatVideoOffset;
                    o.buffer.splice(16, 4, ...createSize(o.data_offset));
                    // console.log(trunVideo.data_offset, o.data_offset)
                }
                
            }
            if(children) {
                enhancer(o);
                updateMoofSize(children);
            }
        });
    }
    enhancer(moof);
    updateMoofSize(moof.children);

    baseDataOffset += moof.size;
    baseDataOffset += mdats[i].length;
    moofs.push(moof);

}

function createSamples(n, j, count, trakId) {
    // {sample_duration, sample_size, sample_flags, sample_composition_time_offset}
    const fragsamples = [];
    let fragsize = 0;
    const duration = durations[trakId];
    let sampleduration = 4856;
    let soundDuration = 1024;
    var sampleOffset = 0;
    for(let i = 0; i < count; i++) {
        let samplesize = samples[trakId][i + n];
        let sampleoffset = timeoffsets[i + n];
        if(trakId === 1) {
            sampleOffset += sampleoffset;
        }
        // if(trakId === 1)console.log(i + n - 1)
        if(i > 0){
            sampleduration = 1024;
        }
        if(j == 20 && i == count - 1) {
            sampleduration = 2765;
            soundDuration = 717;
        }
        if(trakId === 2) {
            sampleoffset = 1024;
            // console.log(samplesize, i + n)
        }
        fragsize += samplesize;
        fragsamples.push({
            sample_duration: sampleduration,
            sample_size: samplesize,
            sample_flags: 0,
            sample_composition_time_offset: sampleoffset,
            // buffer: [0, 0, 0, 0, ...createSize(samplesize), 0, 0, 0, 0, ...createSize(sampleoffset)]
            buffer: trakId == 1 ? 
                    [...createSize(samplesize), ...createSize(sampleoffset)] :
                    // [...createSize(samplesize), ...createSize(sampleoffset)] :
                    // [...createSize(25), ...createSize(samplesize)]
                    // [...createSize(samplesize)]
                    // j > 0 && j < 20 ? 
                    // [...createSize(samplesize)] :
                    [...createSize(soundDuration), ...createSize(samplesize)]
        })
        
    }
    
    // console.log(fragsize)
    return fragsamples;
}

function createMfra() {
    let entriesVideo = createEntries(1);
    let entryVideoSize = entriesVideo.reduce(function(a, b){return a + b.buffer.length}, 0);
    let entriesSound = createEntries(2);
    let entrySoundSize = entriesSound.reduce(function(a, b){return a + b.buffer.length}, 0);
    let mfra = {
        size: entryVideoSize + entrySoundSize + 72,
        type: 'mfra',
        children: [{
            size: entryVideoSize + 24,
            type: 'tfra',
            version: 1,
            flag: 0,
            track_ID: 1,
            reserved: [0],
            length_size_of_traf_num: 0,
            length_size_of_trun_num: 0,
            length_size_of_sample_num: 0,
            number_of_entry: moofs.length,
            entries: entriesVideo,
            buffer: [
                ...createSize(entryVideoSize + 24), 116, 102, 114, 97, 1, 0, 0, 0,
                0, 0, 0, 1, 0, 0, 0, 0, ...createSize(moofs.length),
                ...entriesVideo.reduce(function(a, b){return a.concat(b.buffer)}, [])
            ]
        },
        {
            size: entrySoundSize + 24,
            type: 'tfra',
            version: 1,
            flag: 0,
            track_ID: 1,
            reserved: [0],
            length_size_of_traf_num: 0,
            length_size_of_trun_num: 0,
            length_size_of_sample_num: 0,
            number_of_entry: moofs.length,
            entries: entriesSound,
            buffer: [
                ...createSize(entrySoundSize + 24), 116, 102, 114, 97, 1, 0, 0, 0,
                0, 0, 0, 1, 0, 0, 0, 0, ...createSize(moofs.length),
                ...entriesSound.reduce(function(a, b){return a.concat(b.buffer)}, [])
            ]
        },
        {
            size: 16,
            type: 'mfro',
            buffer: [0, 0, 0, 16, 109, 102, 114, 111, 0, 0, 0, 0, ...createSize(entryVideoSize + entrySoundSize + 72)]
        }]
    }

    let res = [];
    function concatMfraBuffer(box) {
        box.map(function(o, i) {
            const {size, type, children, buffer} = o;
            if(size) {
                array = [...createSize(size), ...createType(type)];
            }else {
                return;
            }
            
            if(children) {
                res = res.concat(array);
                concatMfraBuffer(children);
            }else if(buffer) {
                res = res.concat(buffer);
            }
        });
    }
    concatMfraBuffer([mfra]);

    mfras = res;
}
function createEntries(tid) {
    let keyFrameChunk = keyFrameChunks[tid];
    let timeoffset = tid == 1 ? timeoffsets[0] : 0;
    const entries = [];
    for(let i = 0; i < moofs.length; i++) {
        timeoffset += keyFrameChunk[i].length * 1024;
        let offset = moofOffsets[i];
        let traf_num = 1;
        let trun_num = 1;
        let sample_num = 1;
        entries.push({
            time: timeoffset,
            moof_offset: offset,
            traf_num, trun_num, sample_num,
            buffer: [...createSize(timeoffset, 8), ...createSize(offset, 8), traf_num, trun_num, sample_num]
        });
    }
    return entries;
}


function fillSamplePerChunk() {
    let chunk = chunks[traks.trakId];
    let sample = samples[traks.trakId];
    let sampleIndex = 0;
    let step = 1;

    const trakChunk = [];
    for(let i = 0, j = 0, k = 1; i < sample.length; k++) {
        if(chunk[j] && chunk[j].firstChunk == k) {
            step = chunk[j] ? chunk[j].samplePerChunk : step;
            j++;
        }
        // console.log(step)
        let end = sampleIndex + step;
        trakChunk.push(sample.slice(sampleIndex, end))
        sampleIndex = end;
        
        i += step;
        
    }
    // console.log(soundChunk)
    samplePerChunk[traks.trakId] = trakChunk;
}
function createMdat(source) {
    const videoChunk = samplePerChunk[1];
    const soundChunk = samplePerChunk[2];
    const sample = samples[1];
    const sampleSound = samples[2];
    const keyframesLength = keyframes.length;
    let chunks = [];
    let frames = [];
    let step = 1;
    keyframes.push(sample.length);

    let keyVideoChunks = [];
    let keySoundChunks = [];
    keyFrameChunks = {1: [], 2: []};

    for(let i = 0; i < videoChunk.length; i++) {
        chunks.push(videoChunk[i].concat(soundChunk[i]));
    }

    let res = [];
    let k = 0;
    for(let i = 1, j = 1; j < sample.length;) {
        step = videoChunk[k].length ? videoChunk[k].length : 1;
        
        if(j < keyframes[i]) {
            res = res.concat(chunks[k]);
            keyVideoChunks = keyVideoChunks.concat(videoChunk[k]);
            keySoundChunks = keySoundChunks.concat(soundChunk[k]);
            j += step;
            k++;
        }else {
            i++;
            frames.push(res);
            keyFrameChunks['1'].push(keyVideoChunks);
            keyFrameChunks['2'].push(keySoundChunks);
            keyVideoChunks = [];
            keySoundChunks = [];
            res = [];
        }

    }
    keyVideoChunks = keyVideoChunks.concat(videoChunk[k]);
    keySoundChunks = keySoundChunks.concat(soundChunk[k]);
    keyFrameChunks['1'].push(keyVideoChunks);
    keyFrameChunks['2'].push(keySoundChunks);
    frames.push(res);
    
    // let start = 0;
    // let end = 0;
    // for(let i = 0; i < frames.length; i++) {
    //     let chunk = frames[i];
    //     let size = 0;
    //     let buffer = [];
    //     for(let j = 0; j<chunk.length; j++) {
    //         size += chunk[j];
    //         end = start + chunk[j];
    //         buffer = buffer.concat(source.slice(start, end));
    //     }
    //     buffer = [...createSize(size + 8), 109, 100, 97, 116].concat(buffer);
    //     mdats.push(buffer);
    // }

    // v s 分离

    let start = 0, end = 0, bufferLength;
    let videoBuffer = [], soundBuffer = [];
    for(var x = 0, y = 0, z = 0; x < keyframesLength;) {
        if(y < keyFrameChunks['1'][x].length) {
            let step = videoChunk[z].length;
            let sizeVideo = videoChunk[z].reduce(function(a, b){return a + b}, 0);
            // if(x === 0 && y === 0 && z === 0) {
            //     sizeVideo -= 8;
            // }
            end = start + sizeVideo;
            videoBuffer = videoBuffer.concat(source.slice(start, end));
            start = end;

            let sizeSound = soundChunk[z].reduce(function(a, b){return a + b}, 0);
            end = start + sizeSound;
            soundBuffer = soundBuffer.concat(source.slice(start, end));
            start = end;

            y += step;
            z++;
        }else {
            // z++;
            y = 0;
            x++;
            videoTrack.push(videoBuffer);
            bufferLength = videoBuffer.length + soundBuffer.length;
            mdats.push([...createSize(bufferLength + 8), 109, 100, 97, 116, ...videoBuffer, ...soundBuffer]);
            videoBuffer = [];
            soundBuffer = [];
        }
        // mdats.push([...videoBuffer, ...soundBuffer]);
        // videoBuffer = [];
        // soundBuffer = [];
    }
    // mdats.push([...createSize(size + 8), 109, 100, 97, 116, ...videoBuffer, ...soundBuffer]);

}
function createFragmentedMP4(buf, movie) {
    let start = 0;
    
    function parseMovie(movie) {
        
        movie.map(function(box, i) {
            const {size, type} = box;
            const end = start + size;
                            
            // console.log(type, buf.slice(start, end));
            // console.log(type, size)
            if(creater[type]){
                
                if(type === 'mdat') {
                    // console.log(moofs);
                    baseDataOffset += containBox.size;

                    creater[type](Array.from(buf.slice(start, end)), box);
                    
                }else {
                    let body = creater[type](buf.slice(start, end), box);
                    box.buffer = body;
                    box.size = body.length;

                    start = end;
                }

            }
            
            if(type === 'ftyp') {
                baseDataOffset += box.size;
            }

            if(box.children) {
                // containBox[type] = Object.assign({start, end}, box);
                if(type === 'moov') containBox = box;
                if(type === 'stsd') {
                    start += 16;
                }else if(type !== 'edts') {
                    start += 8;
                }
                // console.log(type, size)
                enhancer(box);

                if(type === 'moov') {
                    // box.children.push(mvex);
                    box.children.splice(3, 0, mvex);
                    box.size += mvex.size;
                }

                parseMovie(box.children);
            }
            
        });
        
        // return result;
    }
    parseMovie(movie);

    concatFragmentedBuffer();
}


function concatFragmentedBuffer() {
    let res = [];
    function concatBaseBuffer(box) {
        box.map(function(o, i) {
            const {size, type, children, buffer} = o;
            // console.log(type, size)
            if(size) {
                array = [...createSize(size), ...createType(type)];
                if(type === 'stsd') {
                    array = array.concat(Array.from(o.value));
                }
                
            }else {
                return;
            }
            
            if(children) {
                baseBuffer = baseBuffer.concat(array);
                concatBaseBuffer(children);
            }else if(buffer) {
                
                baseBuffer = baseBuffer.concat(buffer);
                // console.log(o.buffer)
            }
        });
    }
    concatBaseBuffer(results);

    // console.log('base', baseBuffer, res);

    let j = 0;
    let tid = 0;
    let arraybuffer = [];
    function concatMoofBuffer(box) {
        
        box.map(function(o, i) {
            const {size, type, children, buffer, trak_ID} = o;
            let array = [];
            let mdat = [];
            
            if(type === 'moof') {
                j = i;
            }
            if(type === 'tfhd') {
                tid = trak_ID;
            }
            // console.log(type, size)
            if(size && children) {
                array = [...createSize(size), ...createType(type)];
            }
            
            if(children) {
                // console.log(size, parseSize(array.slice(0, 4)), type, array)
                // res = res.concat(array);
                arraybuffer = arraybuffer.concat(array);
                
                concatMoofBuffer(children);
                
            }else if(buffer) {
                // if(type === 'trun') console.log(o)
                // res = res.concat(buffer);
                arraybuffer = arraybuffer.concat(buffer);

                // console.log(o.buffer)
                if(type === 'trun' && tid === 2) {
                    // mdat = mdats[j];
                    // res = res.concat(mdat);
                    fragmentBuffer.push(arraybuffer);
                    arraybuffer = [];
                    // console.log('mdat', mdat,'------------')
                }
            }


        });
    }
    concatMoofBuffer(moofs);

    // console.log('moofs', fragmentBuffer);
    // console.log(baseBuffer, fragmentBuffer)
    res = res.concat(baseBuffer);
    fragmentBuffer.map(function(a, i) {
        res = res.concat(a);
        res = res.concat(mdats[i]);
    });
    
    // res = res.concat(mfras);
    fragments = new Uint8Array(res);
    console.log(fragments)
}
function createSize(num, flag = 4) {
    let array = new Array(2 * flag).fill(0);
    let num16 = Object.assign(array, Number(num).toString(16).split('').reverse()).reverse();
    let result = num16.join('').match(/.{2}/g);
    return result.map(function(i) {return parseInt(i, 16)});
}
function createType(type) {
    let array = new Array(4).fill(0);
    let chars = Object.assign(array, type.split('').reverse()).reverse();
    let result = chars.map(function(i) {if(i.charCodeAt)return i.charCodeAt();else return i;});
    return result;
}
function concatBuffer(target, source) {
    return target.concat(Array.from(source));
}

function enhancer(obj) {
    obj.children.map(function(box) {
        let size = box.size;
        Object.defineProperty(box, 'size', {
            get: function() {
                return size;
            },
            set: function(value) {
                obj.size = obj.size - size + value;
                size = value;
            }
        })
    })
    
}

module.exports = {createFragmentedMP4};