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
        this.samples = {};
        this.traks = {};
        this.trakIds = [];
        this.durations = {};
        this.keyframes = [];
        this.cttss = [];
        this.timeoffsets = [];
        this.chunks = {};
        this.sequence = {};
        this.sampleDuration = {};
        this.offsets = {};
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
        // this.videoTrack = [];
        this.trakMap = {};
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

                // mvhds.splice(20, 4, 0, 0, 0, box.trak_ID == 1 ? 2 : 1);
                // box.trak_ID = box.trak_ID == 1 ? 2 : 1;
                // mvhds.splice(20, 4, ...this.createSize(box.trak_ID));
                // mvhds.splice(28, 4, 0, 0, 0, 0);
                
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
                this.trakMap[box.handler_type] = this.traks.trakId;

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
            'rtp': (source, box) => {
                return Array.from(source);
            },
            'stts': (source, box) => {
                let newSize = this.createSize(16);
                let newBuf = Array.from(source).slice(4, 8);
                newBuf = newSize.concat(newBuf.concat(new Array(8).fill(0)));
                if(this.traks.handlerType === 'hint') {
                    return newBuf;
                }

                this.sequence[this.traks.trakId] = [];
                this.sampleDuration[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.sequence[this.traks.trakId].push({sampleCount: o.sample_count, sampleDelta: o.sample_delta});
                    this.sampleDuration[this.traks.trakId] = this.sampleDuration[this.traks.trakId].concat(new Array(o.sample_count).fill(o.sample_delta));
                });
                return newBuf;
            },
            'stss': (source, box) => {
                if(this.traks.handlerType === 'hint') {
                    return [];
                }
                this.keyframes = [];
                box.entry.map((o) => {
                    this.keyframes.push(o.sample_number);
                });
                
                return [];
            },
            'ctts': (source, box) => {
                if(this.traks.handlerType === 'hint') {
                    return [];
                }
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
                if(this.traks.handlerType === 'hint') {
                    return [0, 0, 0, 16, 115, 116, 115, 99, 0, 0, 0, 0, 0, 0, 0, 0];
                }
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
                if(this.traks.handlerType === 'hint') {
                    return [0, 0, 0, 20, 115, 116, 115, 122, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                }
                this.samples[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.samples[this.traks.trakId].push(o.entry_size);
                });
                return [0, 0, 0, 20, 115, 116, 115, 122, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            },
            'stco': (source, box) => {
                if(this.traks.handlerType === 'hint') {
                    return [0, 0, 0, 16, 115, 116, 99, 111, 0, 0, 0, 0, 0, 0, 0, 0];
                }
                this.offsets[this.traks.trakId] = [];
                box.entry.map((o) => {
                    this.offsets[this.traks.trakId].push(o.chunk_offset);
                });
                this.fillSamplePerChunk();
                return [0, 0, 0, 16, 115, 116, 99, 111, 0, 0, 0, 0, 0, 0, 0, 0];
            },
            'tref': (source) => {
                return Array.from(source);
            },
            'hmhd': (source) => {
                return Array.from(source);
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
                this.keyframes.slice(0, 11).map((n, i) => {
                    this.createMoof(n, i);
                });
                // this.createMoof(1, 0);

                // this.createMfra();
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
        const videId = this.trakMap['vide'];
        const sounId = this.trakMap['soun'];
        const count = this.keyFrameChunks[videId][i].length;
        const counts = this.keyFrameChunks[sounId][i].length;
        let fragsample = this.createSamples(this.getSampleKeyIndex(videId, i), i, count, videId, 'vide');
        let fragsamples = this.createSamples(this.getSampleKeyIndex(sounId, i), i, counts, sounId, 'soun');
        // let soundsample = createSamples(n, source, count, 2);
        let fragsize = fragsample.reduce(function(a, b){return a + b.buffer.length}, 0);
        let fragsizes = fragsamples.reduce(function(a, b){return a + b.buffer.length}, 0);
        
        let videoSampleDuration = this.sampleDuration[videId][0];
        let soundSampleDuration = this.sampleDuration[sounId][0];

        this.moofOffsets.push(this.baseDataOffset);
        let precount = n - 1;
        let precounts = this.getSampleKeyIndex(sounId, i);

        // let baseMediaDecodeTimeVideo = this.getBaseMediaDecodeTime(videId, precount);
        // let baseMediaDecodeTimeSound = this.getBaseMediaDecodeTime(sounId, precounts);
        let baseMediaDecodeTime1 = videId > sounId ? this.getBaseMediaDecodeTime(sounId, precounts) : this.getBaseMediaDecodeTime(videId, precount);
        let baseMediaDecodeTime2 = videId < sounId ? this.getBaseMediaDecodeTime(sounId, precounts) : this.getBaseMediaDecodeTime(videId, precount);

        let trflag = [0, 0, 10, 5];
        if(!this.timeoffsets.length) {
            trflag = [0, 0, 3, 5];
        }
        
        const createHeadBuffer = (tid) => {
            if(videId === tid) {
                return [
                    0, 0, 0, 28, 116, 102, 104, 100, 0, 2, 0, 56,
                    0, 0, 0, tid - 0,
                    ...this.createSize(videoSampleDuration), 
                    ...this.createSize(fragsample[0].sample_size),
                    1, 1, 0, 0
                ];
            }else {
                return [
                    0, 0, 0, 28, 116, 102, 104, 100, 0, 2, 0, 56,
                    0, 0, 0, tid - 0,
                    ...this.createSize(soundSampleDuration), 
                    ...this.createSize(fragsamples[0].sample_size),
                    1, 1, 0, 0
                ];
            }
            
        }

        const createRunBuffer = (tid) => {
            if(videId === tid) {
                return [
                    ...this.createSize(fragsize + 24), 116, 114, 117, 110, 
                    ...trflag,
                    ...this.createSize(count), ...this.createSize(fragsize),
                    2, 0, 0, 0, 
                    ...fragsample.reduce(function(a, b){return a.concat(b.buffer)}, [])
                ];
            }else {
                return [
                    ...this.createSize(fragsizes + 24), 116, 114, 117, 110,
                    0, 0, 3, 5,
                    ...this.createSize(counts), ...this.createSize(fragsizes),
                    2, 0, 0, 0,
                    ...fragsamples.reduce(function(a, b){return a.concat(b.buffer)}, [])
                    
                ];
            }
        }

        const traf1 = {size: 0, headSize: 0, runSize: 0, samples: []};
        const traf2 = {size: 0, headSize: 0, runSize: 0, samples: []};
        const createTraf = (traf, size, headSize, runSize, samples) => {
            traf.size = size;
            traf.headSize = headSize;
            traf.runSize = runSize;
            traf.samples = samples;
        }
        if(videId < sounId) {
            createTraf(traf1, 80, 28, 24, fragsample);
            createTraf(traf2, 80, 28, 24, fragsamples);
        }else {
            createTraf(traf2, 80, 28, 24, fragsample);
            createTraf(traf1, 80, 28, 24, fragsamples);
        }

        let moof = {
            size: 184,
            type: 'moof',
            children: [
                {
                    size: 16,
                    type: 'mfhd',
                    sequence_number: i + 1,
                    buffer: [0, 0, 0, 16, 109, 102, 104, 100, 0, 0, 0, 0, ...this.createSize(i + 1)]
                },
                {
                    // size: 80,
                    size: traf1.size,
                    type: 'traf',
                    children: [
                        {
                            // size: 28,
                            size: traf1.headSize,
                            type: 'tfhd',
                            trak_ID: 1,
                            base_data_offset: this.baseDataOffset,
                            // sample_description_index: 1,
                            default_sample_duration: videoSampleDuration,
                            // default_sample_size: this.keyFrameChunks['1'][i][0],
                            default_sample_size: fragsample[0].sample_size,
                            // buffer: [
                            //     0, 0, 0, 28, 116, 102, 104, 100, 0, 2, 0, 56,
                            //     0, 0, 0, 1, 
                            //     // ...this.createSize(this.baseDataOffset, 8), 
                            //     // 0, 0, 0, 1,
                            //     ...this.createSize(videoSampleDuration), 
                            //     ...this.createSize(fragsample[0].sample_size),
                            //     1, 1, 0, 0
                            // ],
                            buffer: createHeadBuffer(1),
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
                            buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...this.createSize(baseMediaDecodeTime1, 8)]
                            // buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        },
                        {
                            // size: 24,
                            size: traf1.runSize,
                            type: 'trun',
                            sample_count: count,
                            data_offset: 0,
                            first_sample_flags: [2, 0, 0, 0],
                            // samples: fragsample,
                            samples: traf1.samples,
                            // buffer: [
                            //     ...this.createSize(fragsize + 24), 116, 114, 117, 110, 
                            //     ...trflag,
                            //     ...this.createSize(count), ...this.createSize(fragsize),
                            //     2, 0, 0, 0, 
                            //     ...fragsample.reduce(function(a, b){return a.concat(b.buffer)}, [])
                            // ]
                            buffer: createRunBuffer(1)
                        }
                    ]
                },
                {
                    // size: 72,
                    size: traf2.size,
                    type: 'traf',
                    children: [
                        {
                            // size: 24,
                            size: traf2.headSize,
                            type: 'tfhd',
                            trak_ID: 2,
                            base_data_offset: this.baseDataOffset,
                            // sample_description_index: 1,
                            default_sample_duration: soundSampleDuration,
                            // default_sample_size: this.keyFrameChunks['2'][i][0],
                            default_sample_size: fragsamples[0].sample_size,
                            // buffer: [
                            //     0, 0, 0, 24, 116, 102, 104, 100, 0, 2, 0, 24,
                            //     0, 0, 0, 2, 
                            //     // ...this.createSize(this.baseDataOffset, 8), 
                            //     // 0, 0, 0, 1,
                            //     ...this.createSize(soundSampleDuration), 
                            //     ...this.createSize(fragsamples[0].sample_size),
                            //     // 2, 0, 0, 0
                            // ],
                            buffer: createHeadBuffer(2),
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
                            buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, ...this.createSize(baseMediaDecodeTime2, 8)]
                            // buffer: [0, 0, 0, 20, 116, 102, 100, 116, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        },
                        {
                            // size: 20,
                            size: traf2.runSize,
                            type: 'trun',
                            sample_count: counts,
                            data_offset: 0,
                            // first_sample_flags: [0, 0, 1, 0],
                            // samples: fragsamples,
                            samples: traf2.samples,
                            // buffer: [
                            //     ...this.createSize(fragsizes + 20), 116, 114, 117, 110,
                            //     // ...soundflags,
                            //     0, 0, 3, 1,
                            //     ...this.createSize(counts), ...this.createSize(fragsizes),
                            //     // [0, 0, 1, 0],
                            //     ...fragsamples.reduce(function(a, b){return a.concat(b.buffer)}, [])
                            // ]
                            buffer: createRunBuffer(2)
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

    createSamples(n, j, count, trakId, trakType) {
        // {sample_duration, sample_size, sample_flags, sample_composition_time_offset}
        const fragsamples = [];
        let fragsize = 0;
        // let sampleOffset = 0;
        for(let i = 0; i < count; i++) {
            let samplesize = this.samples[trakId][i + n];
            let sampleoffset = this.timeoffsets[i + n] || 0;
            let sampleduration = this.sampleDuration[trakId][i + n];
            // if(trakType === 'vide') {
            //     sampleOffset += sampleoffset;
            // }
            fragsize += samplesize;
            fragsamples.push({
                sample_duration: sampleduration,
                sample_size: samplesize,
                sample_flags: 0,
                // sample_composition_time_offset: sampleduration,
                // buffer: [0, 0, 0, 0, ...this.createSize(samplesize), 0, 0, 0, 0, ...this.createSize(sampleoffset)]
                buffer: trakType === 'vide' ? 
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
        const videId = this.trakMap['vide'];
        const sounId = this.trakMap['soun'];
        const videoChunk = this.samplePerChunk[videId];
        const soundChunk = this.samplePerChunk[sounId];
        const sample = this.samples[videId];
        // const sampleSound = this.samples[2];
        const keyframesLength = this.keyframes.length;
        this.keyframes.push(sample.length);

        // console.log('samples', this.samples, '\nsamplePerChunk', this.samplePerChunk, '\nkeyframes', this.keyframes, '\noffsets', this.offsets);

        let end = 0, bufferLength = 0;
        let videoBuffer = [], soundBuffer = [];
        let keyframeInChunk = false;
        let chunkAtSide = true;

        let videoTracks = [];
        let soundTracks = [];
        let keyVideoBuffer = [];
        let keySoundBuffer = [];

        let keyVideoChunks = [];
        let keySoundChunks = [];
        this.keyFrameChunks = {};
        this.keyFrameChunks[videId] = [];
        this.keyFrameChunks[sounId] = [];
        let sampleLength = videoChunk[0].length;
        let i = 0, j = 1, k = 0;
        const t = this;
        function createBuffer(buffer, chunk, tid) {
            let chunkSize = chunk.reduce(function(a, b) {return a + b;}, 0);
            end = start + chunkSize;
            buffer.push(source.slice(start, end));
            start = end;
            if(chunkAtSide) {
                if(tid === videId) {
                    start = t.offsets[sounId][k];
                }else {
                    start = t.offsets[videId][k + 1];
                }
                
            }
            // console.log(t.offsets[sounId][k], t.offsets[videId][k], k, chunkAtSide, j);
            
            // console.log(start, k);
        }

        for(; i < sample.length; i++) {
            if(i < this.keyframes[j] - 1) {
                keyVideoChunks.push(sample[i]);
                
                if(i === sampleLength - 1) {
                    // console.log(i, sample[i], sampleLength)
                    keySoundChunks = soundChunk[k];

                    if(videId < sounId) {
                        createBuffer(videoBuffer, keyVideoChunks, videId);
                        createBuffer(soundBuffer, keySoundChunks, sounId);
                        soundTracks = soundTracks.concat(keySoundChunks);
                    }else {
                        if(keyframeInChunk){
                            // createBuffer(soundBuffer, keySoundChunks);
                            createBuffer(videoBuffer, keyVideoChunks);
                        }else {
                            createBuffer(soundBuffer, keySoundChunks, sounId);
                            createBuffer(videoBuffer, keyVideoChunks, videId);
                            soundTracks = soundTracks.concat(keySoundChunks);
                        }
                    }

                    videoTracks = videoTracks.concat(keyVideoChunks);
                    keyVideoChunks = [];

                    k++;
                    sampleLength += videoChunk[k].length;

                    keyframeInChunk = false;
                }
            }else {
                keyVideoChunks.push(sample[i]);
                if(i === sampleLength - 1) {
                    // keyVideoChunks.push(sample[i]);
                    keySoundChunks = soundChunk[k] || [];

                    if(videId < sounId) {
                        createBuffer(videoBuffer, keyVideoChunks, videId);
                        createBuffer(soundBuffer, keySoundChunks, sounId);
                    }else {
                        createBuffer(soundBuffer, keySoundChunks, sounId);
                        createBuffer(videoBuffer, keyVideoChunks, videId);
                    }

                    keyVideoBuffer.push(videoBuffer);
                    videoBuffer = [];
                    
                    videoTracks = videoTracks.concat(keyVideoChunks);
                    this.keyFrameChunks[videId].push(videoTracks);
                    videoTracks = [];
                    keyVideoChunks = [];
                    

                    keySoundBuffer.push(soundBuffer);
                    soundBuffer = [];
                    
                    soundTracks = soundTracks.concat(keySoundChunks);
                    this.keyFrameChunks[sounId].push(soundTracks);
                    soundTracks = [];

                    k++;
                    sampleLength += videoChunk[k] ? videoChunk[k].length : 0;

                    keyframeInChunk = false;
                }else {
                    keySoundChunks = soundChunk[k] || [];
                    chunkAtSide = false;
                    if(videId < sounId) {
                        createBuffer(videoBuffer, keyVideoChunks, videId);
                    }else {
                        // keySoundChunks = soundChunk[k] || [];
                        createBuffer(soundBuffer, keySoundChunks, sounId);
                        createBuffer(videoBuffer, keyVideoChunks, videId);
                        soundTracks = soundTracks.concat(keySoundChunks);
                    }
                    chunkAtSide = true;
                    

                    keyVideoBuffer.push(videoBuffer);
                    videoBuffer = [];
                    
                    videoTracks = videoTracks.concat(keyVideoChunks);
                    this.keyFrameChunks[videId].push(videoTracks);
                    videoTracks = [];
                    keyVideoChunks = [];

                    // console.log(keySoundChunks);
                    keySoundBuffer.push(soundBuffer);
                    soundBuffer = [];
                    this.keyFrameChunks[sounId].push(soundTracks);
                    soundTracks = [];

                    
                    // keyVideoChunks.push(sample[i]);
                    keyframeInChunk = true;
                }
                j++;
            }
            
        }
        for(let x = 0; x < keyframesLength; x++) {
            videoBuffer = this.concatTypeArray(...keyVideoBuffer[x]);
            soundBuffer = this.concatTypeArray(...keySoundBuffer[x]);
            bufferLength = videoBuffer.length + soundBuffer.length;
            let bufferHead = new Uint8Array([...this.createSize(bufferLength + 8), 109, 100, 97, 116]);
            if(videId < sounId) {
                this.mdats.push(this.concatTypeArray(bufferHead, videoBuffer, soundBuffer)); 
            }else {
                this.mdats.push(this.concatTypeArray(bufferHead, soundBuffer, videoBuffer));
            }
            
            videoBuffer = [];
            soundBuffer = [];
        }
        keyVideoBuffer = null;
        keySoundBuffer = null;
        // console.log(keyVideoBuffer, keySoundBuffer);
        // console.log(this.keyFrameChunks);
        // console.log(this.mdats);
        // console.log('timeoffset', this.offsets, '\nduration', this.sampleDuration, '\nchunks', this.chunks);
        
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
        this.containBox.children[3].size = 0;
        this.containBox.children[4].size = 0;
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
