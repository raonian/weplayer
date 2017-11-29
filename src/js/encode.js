/* 生成 fragments mp4 */
/**
 * fragments mp4格式编码
 * @description fragments mp4格式与mp4格式相似，不同之处在于moof box
 * @author 饶念
 */

export default class Encode {
    constructor() {
        this.fragments = [];
        // this.flexlen = 0;
        this.containBox = {};
        // this.resultFrag = [];
        this.moofs = [];
        this.samples = [];
        this.traks = {};
        this.trakIds = [];
        this.durations = {};
        this.keyframes = [];
        this.cttss = [];
        this.timeoffsets = [];
        this.chunks = [];
        this.sequence = {};
        this.sampleDuration = {};
        this.offsets = [];
        this.baseDataOffset = 0;
        // this.metaDataOffset = 8;
        this.mdats = [];
        this.samplePerChunk = {};
        this.keyFrameChunks = {};
        this.baseBuffer = [];
        this.fragmentBuffer = [];
        this.mfras = [];
        this.moofOffsets = [];
        this.mduration = 0;
        // this.fragmentMdats = [];
        this.videoTrack = [];
        this.mvex = {
            size: 72,
            type: 'mvex',
            // buffer: [0, 0, 0, 72, 109, 118, 101, 120],
            children: [
                // {
                //     size: 16,
                //     type: 'mehd',
                //     buffer: [0, 0, 0, 16, 109, 101, 104, 100, 0, 0, 0, 0, ...this.createSize(this.mduration)]
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
        this.creater = {
            'ftyp': (source) => {
                let ary = Array.from(source);
                return ary;
            },
            'mvhd': (source, box) => {
                let mvhds = Array.from(source);
                this.mduration = box.duration;
                // this.mvex.children[0].buffer.splice(12, 4, ...this.createSize(box.duration));
                return mvhds;
            },
            'iods': (source, box) => {
                return [];
            },
            'tkhd': (source, box) => {
                this.traks.trakId = box.trak_ID;
                this.trakIds.push(box.trak_ID);
                
                let mvhds = Array.from(source);
                mvhds.splice(20, 4, ...this.createSize(box.trak_ID));
                mvhds.splice(28, 4, 0, 0, 0, 0);
                
                return mvhds;
                // return Array.from(source);
            },
            'edts': (source, box) => {
                return [];
            },
            'mdhd': (source, box) => {
                this.traks.duration = box.duration;
                this.traks.timescale = box.timescale;
                this.durations[this.traks.trakId] = box.duration;

                let mvhds = Array.from(source);
                return mvhds;
            },
            'hdlr': (source, box) => {
                this.traks.handlerType = box.handler_type;

                return Array.from(source);
            },
            'vmhd': (source) => {
                return Array.from(source);
            },
            'smhd': (source) => {
                return Array.from(source);
            },
            'dref': (source, box) => {
                return Array.from(source);
            },
            'avc1': (source, box) => {
                return Array.from(source);
            },
            'mp4a': (source, box) => {
                return Array.from(source);
            },
            'stts': (source, box) => {
                let newSize = this.createSize(16);
                let newBuf = Array.from(source).slice(4, 8);
                newBuf = newSize.concat(newBuf.concat(new Array(8).fill(0)));

                this.sequence[this.traks.trakId] = [];
                this.sampleDuration[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.sequence[this.traks.trakId].push({sampleCount: o.sample_count, sampleDelta: o.sample_delta});
                    this.sampleDuration[this.traks.trakId] = this.sampleDuration[this.traks.trakId].concat(new Array(o.sample_count).fill(o.sample_delta));
                });
                return newBuf;
            },
            'stss': (source, box) => {
                this.keyframes = [];
                box.entry.map((o) => {
                    this.keyframes.push(o.sample_number);
                });
                
                return [];
            },
            'ctts': (source, box) => {
                this.cttss = [];
                box.entry.map((o) => {
                    this.cttss.push({sampleCount: o.sample_count, sampleOffset: o.sample_offset});
                });
                for(let i = 0, j = 1; i < this.cttss.length;) {
                    const {sampleCount, sampleOffset} = this.cttss[i];
                    if(j === sampleCount) {
                        i++;
                        j = 1;
                    }else {
                        j++;
                    }
                    this.timeoffsets.push(sampleOffset);
                    // this.timeoffsets
                }
                
                return [];
            },
            'stsc': (source, box) => {
                this.chunks[this.traks.trakId] = [];
                // samplePerChunk[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.chunks[this.traks.trakId].push({
                        firstChunk: o.first_chunk,
                        sampleDescriptionIndex: o.sample_description_index,
                        samplePerChunk: o.samples_per_chunk
                    });
                    // samplePerChunk[this.traks.trakId].push(o.samples_per_chunk);
                })
                
                return [0, 0, 0, 16, 115, 116, 115, 99, 0, 0, 0, 0, 0, 0, 0, 0];
            },
            'stsz': (source, box) => {
                this.samples[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.samples[this.traks.trakId].push(o.entry_size);
                });
                return [0, 0, 0, 20, 115, 116, 115, 122, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            },
            'stco': (source, box) => {
                this.offsets[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.offsets[this.traks.trakId].push(o.chunk_offset);
                });
                this.fillSamplePerChunk();
                return [0, 0, 0, 16, 115, 116, 99, 111, 0, 0, 0, 0, 0, 0, 0, 0];
            },
            'udta': (source, box) => {
                const {size, type, value} = box;
                let values = Array.from(value);
                return [...this.createSize(size), ...this.createType(type), ...values];
            },
            'free': (source) => {
                return [];
            },
            'mdat': (source, box, start) => {
                this.createMdat(source, start);
                this.keyframes.slice(0, -1).map((n, i) => {
                    this.createMoof(n, i);
                });

                this.createMfra();
            }
        };

    }
    getSampleKeyIndex(trakid, i) {
        let chunk = this.keyFrameChunks[trakid];
        let index = 0;
        for(let j = 0; j < chunk.length; j++) {
            if(i === j) {
                return index;
            }
            index += chunk[j].length;
        }
    }
    getBaseMediaDecodeTime(tid, count) {
        let durations = this.sampleDuration[tid];
        let time = 0;
        for(let i = 0; i < count; i++) {
            time += durations[i];
        }
        return time;
    }
    createMoof(n, i) {
        // console.log(createSamples(source, count, 1)); return;
        const count = this.keyFrameChunks['1'][i].length;
        const counts = this.keyFrameChunks['2'][i].length;
        let fragsample = this.createSamples(this.getSampleKeyIndex(1, i), i, count, 1);
        let fragsamples = this.createSamples(this.getSampleKeyIndex(2, i), i, counts, 2);
        // let soundsample = createSamples(n, source, count, 2);
        let fragsize = fragsample.reduce(function(a, b){return a + b.buffer.length}, 0);
        let fragsizes = fragsamples.reduce(function(a, b){return a + b.buffer.length}, 0);
        
        let videoSampleDuration = this.sampleDuration['1'][0];
        let soundSampleDuration = this.sampleDuration['2'][0];

        this.moofOffsets.push(this.baseDataOffset);
        let precount = n - 1;
        let precounts = this.getSampleKeyIndex(2, i);

        let baseMediaDecodeTimeVideo = this.getBaseMediaDecodeTime('1', precount);
        let baseMediaDecodeTimeSound = this.getBaseMediaDecodeTime('2', precounts);

        let trflag = [0, 0, 10, 5];
        if(!this.timeoffsets.length) {
            trflag = [0, 0, 3, 5];
        }
        
        let moof = {
            size: 176,
            type: 'moof',
            children: [
                {
                    size: 16,
                    type: 'mfhd',
                    sequence_number: i + 1,
                    buffer: [0, 0, 0, 16, 109, 102, 104, 100, 0, 0, 0, 0, ...this.createSize(i + 1)]
                },
                {
                    size: 80,
                    type: 'traf',
                    children: [
                        {
                            size: 28,
                            type: 'tfhd',
                            trak_ID: 1,
                            base_data_offset: this.baseDataOffset,
                            // sample_description_index: 1,
                            default_sample_duration: videoSampleDuration,
                            // default_sample_size: this.keyFrameChunks['1'][i][0],
                            default_sample_size: fragsample[0].sample_size,
                            buffer: [
                                0, 0, 0, 28, 116, 102, 104, 100, 0, 2, 0, 56,
                                0, 0, 0, 1, 
                                // ...this.createSize(this.baseDataOffset, 8), 
                                // 0, 0, 0, 1,
                                ...this.createSize(videoSampleDuration), 
                                ...this.createSize(fragsample[0].sample_size),
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
                            buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...this.createSize(baseMediaDecodeTimeVideo, 8)]
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
                                ...this.createSize(fragsize + 24), 116, 114, 117, 110, 
                                ...trflag,
                                ...this.createSize(count), ...this.createSize(fragsize),
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
                            base_data_offset: this.baseDataOffset,
                            // sample_description_index: 1,
                            default_sample_duration: soundSampleDuration,
                            // default_sample_size: this.keyFrameChunks['2'][i][0],
                            default_sample_size: fragsamples[0].sample_size,
                            buffer: [
                                0, 0, 0, 24, 116, 102, 104, 100, 0, 2, 0, 24,
                                0, 0, 0, 2, 
                                // ...this.createSize(this.baseDataOffset, 8), 
                                // 0, 0, 0, 1,
                                ...this.createSize(soundSampleDuration), 
                                ...this.createSize(fragsamples[0].sample_size),
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
                            buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...this.createSize(baseMediaDecodeTimeSound, 8)]
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
                                ...this.createSize(fragsizes + 20), 116, 114, 117, 110,
                                // ...soundflags,
                                0, 0, 3, 1,
                                ...this.createSize(counts), ...this.createSize(fragsizes),
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
        let updateMoofSize = (box) => {
            box.map((o) => {
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
                        // let mdatVideoOffset = this.keyFrameChunks['1'][i].reduce(function(a, b){return a + b}, 0);
                        let mdatVideoOffset = trunVideo.samples.reduce(function(a, b){return a + b.sample_size}, 0);
                        trunVideo.data_offset = moof.size + 8;
                        trunVideo.buffer.splice(16, 4, ...this.createSize(trunVideo.data_offset));
                        o.data_offset = moof.size + 8 + mdatVideoOffset;
                        o.buffer.splice(16, 4, ...this.createSize(o.data_offset));
                        // console.log(trunVideo.data_offset, o.data_offset)
                    }
                    
                }
                if(children) {
                    this.enhancer(o);
                    updateMoofSize(children);
                }
            });
        }
        this.enhancer(moof);
        updateMoofSize(moof.children);

        this.baseDataOffset += moof.size;
        this.baseDataOffset += this.mdats[i].length;
        this.moofs.push(moof);

    }

    createSamples(n, j, count, trakId) {
        // {sample_duration, sample_size, sample_flags, sample_composition_time_offset}
        const fragsamples = [];
        let fragsize = 0;
        let sampleOffset = 0;
        for(let i = 0; i < count; i++) {
            let samplesize = this.samples[trakId][i + n];
            let sampleoffset = this.timeoffsets[i + n] || 0;
            let sampleduration = this.sampleDuration[trakId][i + n];
            if(trakId === 1) {
                sampleOffset += sampleoffset;
            }
            fragsize += samplesize;
            fragsamples.push({
                sample_duration: sampleduration,
                sample_size: samplesize,
                sample_flags: 0,
                // sample_composition_time_offset: sampleduration,
                // buffer: [0, 0, 0, 0, ...this.createSize(samplesize), 0, 0, 0, 0, ...this.createSize(sampleoffset)]
                buffer: trakId == 1 ? 
                        this.timeoffsets.length ?
                        [...this.createSize(samplesize), ...this.createSize(sampleoffset)] :
                        [...this.createSize(sampleduration), ...this.createSize(samplesize)] :
                        [...this.createSize(sampleduration), ...this.createSize(samplesize)]
            })
            
        }
        
        // console.log(fragsize)
        return fragsamples;
    }

    createMfra() {
        let entriesVideo = this.createEntries(1);
        let entryVideoSize = entriesVideo.reduce(function(a, b){return a + b.buffer.length}, 0);
        let entriesSound = this.createEntries(2);
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
                number_of_entry: this.moofs.length,
                entries: entriesVideo,
                buffer: [
                    ...this.createSize(entryVideoSize + 24), 116, 102, 114, 97, 1, 0, 0, 0,
                    0, 0, 0, 1, 0, 0, 0, 0, ...this.createSize(this.moofs.length),
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
                number_of_entry: this.moofs.length,
                entries: entriesSound,
                buffer: [
                    ...this.createSize(entrySoundSize + 24), 116, 102, 114, 97, 1, 0, 0, 0,
                    0, 0, 0, 1, 0, 0, 0, 0, ...this.createSize(this.moofs.length),
                    ...entriesSound.reduce(function(a, b){return a.concat(b.buffer)}, [])
                ]
            },
            {
                size: 16,
                type: 'mfro',
                buffer: [0, 0, 0, 16, 109, 102, 114, 111, 0, 0, 0, 0, ...this.createSize(entryVideoSize + entrySoundSize + 72)]
            }]
        }

        let res = [];
        let concatMfraBuffer = (box) => {
            box.map((o, i) => {
                const {size, type, children, buffer} = o;
                let array = [];
                if(size) {
                    array = [...this.createSize(size), ...this.createType(type)];
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

        this.mfras = res;
    }
    createEntries(tid) {
        let keyFrameChunk = this.keyFrameChunks[tid];
        let timeoffset = tid == 1 ? this.timeoffsets[0] : 0;
        const entries = [];
        for(let i = 0; i < this.moofs.length; i++) {
            timeoffset += keyFrameChunk[i].length * 1024;
            let offset = this.moofOffsets[i];
            let traf_num = 1;
            let trun_num = 1;
            let sample_num = 1;
            entries.push({
                time: timeoffset,
                moof_offset: offset,
                traf_num, trun_num, sample_num,
                buffer: [...this.createSize(timeoffset, 8), ...this.createSize(offset, 8), traf_num, trun_num, sample_num]
            });
        }
        return entries;
    }


    fillSamplePerChunk() {
        let chunk = this.chunks[this.traks.trakId];
        let sample = this.samples[this.traks.trakId];
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
        this.samplePerChunk[this.traks.trakId] = trakChunk;
    }

    /**
     * 根据关键帧列表和samplePerChunk，创建fragment mdat box
     * @param {原始数据} source 
     * @param {起始位置} start 
     */
    createMdat(source, start) {
        const fromindex = start;
        const videoChunk = this.samplePerChunk[1];
        const soundChunk = this.samplePerChunk[2];
        const sample = this.samples[1];
        // const sampleSound = this.samples[2];
        const keyframesLength = this.keyframes.length;
        this.keyframes.push(sample.length);

        // console.log(this.samples, 'samples', this.samplePerChunk, 'samplePerChunk', this.keyframes);

        let end = 0, bufferLength = 0;
        let videoBuffer = [], soundBuffer = [];

        let videoTracks = [];
        let soundTracks = [];
        let keyVideoBuffer = [];
        let keySoundBuffer = [];

        let keyVideoChunks = [];
        let keySoundChunks = [];
        this.keyFrameChunks = {1: [], 2: []};
        let sampleLength = videoChunk[0].length;
        let i = 0, j = 1, k = 0;
        for(; i < sample.length; i++) {
            if(i < this.keyframes[j] - 1) {
                keyVideoChunks.push(sample[i]);
                
                if(i === sampleLength - 1) {
                    // console.log(i, sample[i], sampleLength)
                    keySoundChunks = soundChunk[k];

                    let chunkSize = keyVideoChunks.reduce(function(a, b){return a + b;}, 0);
                    end = start + chunkSize;
                    videoBuffer.push(source.slice(start, end));
                    start = end;
                    videoTracks = videoTracks.concat(keyVideoChunks);
                    keyVideoChunks = [];

                    chunkSize = keySoundChunks.reduce(function(a, b){return a + b;}, 0);
                    end = start + chunkSize;
                    soundBuffer.push(source.slice(start, end));
                    start = end;
                    soundTracks = soundTracks.concat(keySoundChunks);

                    k++;
                    sampleLength += videoChunk[k].length;
                }
            }else {
                keyVideoChunks.push(sample[i]);
                if(i === sampleLength - 1) {
                    // keyVideoChunks.push(sample[i]);

                    let chunkSize = keyVideoChunks.reduce(function(a, b){return a + b;}, 0);
                    end = start + chunkSize;
                    videoBuffer.push(source.slice(start, end));
                    keyVideoBuffer.push(videoBuffer);
                    videoBuffer = [];
                    start = end;
                    videoTracks = videoTracks.concat(keyVideoChunks);
                    this.keyFrameChunks['1'].push(videoTracks);
                    videoTracks = [];
                    keyVideoChunks = [];
                    
                    keySoundChunks = soundChunk[k] || [];

                    chunkSize = keySoundChunks.reduce(function(a, b){return a + b;}, 0);
                    end = start + chunkSize;
                    soundBuffer.push(source.slice(start, end));
                    keySoundBuffer.push(soundBuffer);
                    soundBuffer = [];
                    start = end;
                    
                    soundTracks = soundTracks.concat(keySoundChunks);
                    this.keyFrameChunks['2'].push(soundTracks);
                    soundTracks = [];

                    k++;
                    sampleLength += videoChunk[k] ? videoChunk[k].length : 0;
                }else {
                    let chunkSize = keyVideoChunks.reduce(function(a, b){return a + b;}, 0);
                    end = start + chunkSize;
                    videoBuffer.push(source.slice(start, end));
                    keyVideoBuffer.push(videoBuffer);
                    videoBuffer = [];
                    start = end;
                    videoTracks = videoTracks.concat(keyVideoChunks);
                    this.keyFrameChunks['1'].push(videoTracks);
                    videoTracks = [];

                    // console.log(keySoundChunks);
                    keySoundBuffer.push(soundBuffer);
                    soundBuffer = [];
                    this.keyFrameChunks['2'].push(soundTracks);
                    soundTracks = [];

                    keyVideoChunks = [];
                    // keyVideoChunks.push(sample[i]);
                    
                }
                j++;
            }
            
        }
        for(let x = 0; x < keyframesLength; x++) {
            videoBuffer = this.concatTypeArray(...keyVideoBuffer[x]);
            soundBuffer = this.concatTypeArray(...keySoundBuffer[x]);
            bufferLength = videoBuffer.length + soundBuffer.length;
            let bufferHead = new Uint8Array([...this.createSize(bufferLength + 8), 109, 100, 97, 116]);
            this.mdats.push(this.concatTypeArray(bufferHead, videoBuffer, soundBuffer));
            videoBuffer = [];
            soundBuffer = [];
        }
        // console.log(this.keyFrameChunks, keyVideoBuffer);
        // console.log(this.mdats);

    }
    concatTypeArray(...arrays) {
        let total = 0;
        for(let arr of arrays) {
            total += arr.length;
        }
        let result = new Uint8Array(total);
        let offset = 0;
        for(let arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    // 入口函数
    createFragmentedMP4(buf, movie) {
        let start = 0;
        
        let parseMovie = (movie) => {
            
            movie.map((box, i) => {
                const {size, type} = box;
                const end = start + size;
                                
                // console.log(type, buf.slice(start, end));
                // console.log(type, size)
                if(this.creater[type]){
                    
                    if(type === 'mdat') {
                        // console.log(moofs);
                        this.baseDataOffset += this.containBox.size;
                        // this.creater[type](Array.from(buf.slice(start, end)), box);
                        this.creater[type](buf, box, start);
                        
                    }else {
                        let body = this.creater[type](buf.slice(start, end), box);
                        // let body = this.creater[type](new Uint8Array(buf, start, size), box);
                        box.buffer = body;
                        box.size = body.length;

                        start = end;
                    }

                }
                
                if(type === 'ftyp') {
                    this.baseDataOffset += box.size;
                }

                if(box.children) {
                    // containBox[type] = Object.assign({start, end}, box);
                    if(type === 'moov') this.containBox = box;
                    if(type === 'stsd') {
                        start += 16;
                    }else if(type !== 'edts') {
                        start += 8;
                    }
                    // console.log(type, size)
                    this.enhancer(box);

                    if(type === 'moov') {
                        // box.children.push(mvex);
                        // box.children.splice(3, 0, this.mvex);
                        box.children.push(this.mvex);
                        box.size += this.mvex.size;
                    }

                    parseMovie(box.children);
                }
                
            });
            
            // return result;
        }
        parseMovie(movie);

        this.concatFragmentedBuffer(movie);

        return this.fragments;
    }

    concatFragmentedBuffer(movie) {
        let res = [];
        let concatBaseBuffer = (box) => {
            box.map((o, i) => {
                const {size, type, children, buffer} = o;
                // console.log(type, size)
                let array = [];
                if(size) {
                    array = [...this.createSize(size), ...this.createType(type)];
                    if(type === 'stsd') {
                        array = array.concat(Array.from(o.value));
                    }
                    
                }else {
                    return;
                }
                
                if(children) {
                    this.baseBuffer = this.baseBuffer.concat(array);
                    concatBaseBuffer(children);
                }else if(buffer) {
                    
                    this.baseBuffer = this.baseBuffer.concat(buffer);
                    // console.log(o.buffer)
                }
            });
        }
        concatBaseBuffer(movie);

        // console.log('base', this.baseBuffer, res);

        let j = 0;
        let tid = 0;
        let arraybuffer = [];
        let concatMoofBuffer = (box) => {
            
            box.map((o, i) => {
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
                    array = [...this.createSize(size), ...this.createType(type)];
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
                        // mdat = this.mdats[j];
                        // res = res.concat(mdat);
                        this.fragmentBuffer.push(arraybuffer);
                        arraybuffer = [];
                        // console.log('mdat', mdat,'------------')
                    }
                }


            });
        }
        concatMoofBuffer(this.moofs);

        // console.log('moofs', this.fragmentBuffer);
        // console.log(this.baseBuffer, this.fragmentBuffer)
        res = res.concat(this.baseBuffer);
        let resultBuffer = [new Uint8Array(this.baseBuffer)];
        this.fragmentBuffer.map((a, i) => {
            // if(i > 5 && i < 15) return;
            // res = res.concat(a);
            // res = res.concat(this.mdats[i]);

            resultBuffer.push(new Uint8Array(a));
            resultBuffer.push(this.mdats[i]);
        });
        // resultBuffer.push(this.mfras);
        // res = res.concat(mfras);
        // this.fragments = new Uint8Array(res);
        this.fragments = this.concatTypeArray(...resultBuffer);
        // console.log(this.fragments, 'fragments');
    }
    createSize(num, flag = 4) {
        let array = new Array(2 * flag).fill(0);
        let num16 = Object.assign(array, Number(num).toString(16).split('').reverse()).reverse();
        let result = num16.join('').match(/.{2}/g);
        return result.map(function(i) {return parseInt(i, 16)});
    }
    createType(type) {
        let array = new Array(4).fill(0);
        let chars = Object.assign(array, type.split('').reverse()).reverse();
        let result = chars.map(function(i) {if(i.charCodeAt)return i.charCodeAt();else return i;});
        return result;
    }
    concatBuffer(target, source) {
        return target.concat(Array.from(source));
    }

    enhancer(obj) {
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
}
