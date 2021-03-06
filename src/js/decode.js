/**
 * mp4格式文件解码
 * @description mp4格式由若干个box构成，box可以嵌套box，每个box起始由4字节内容描述该box长度，和4字节内容描述类型
 * @author 饶念
 */

export default class Decoder {
    constructor() {
        let t = this;
        this.parser = {
            'ftyp': function(buf, start, size) {
                const offset = 4;
                let end = start + offset;
                const major_brand = t.parseType(buf.slice(start, end));
                start = end;
                end = start + offset;
                const minor_version = t.parseType(buf.slice(start, end));
                start = end;
                end = start + offset;

                // console.log(buf.slice(start, size))
                const compatible = t.cutArray(buf.slice(start, size), offset).map(function(a){return t.parseType(a);});

                return {
                    major_brand, minor_version, compatible
                }
            },
            'moov': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end));

                let head = end;
                t.moov.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                t.trak = [];
                t.parser['moov'](buf, len + start - offset, size, index);

                return {children: t.moov};
            },
            'mvhd': function(buf, start, size) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));
                start = end;
                offset = 3;
                end = start + offset; // flags
                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                start = end;
                end = start + offset;
                const creation_time = t.parseUTCDate(buf.slice(start, end));
                // console.log(createTime, new Date(createTime*1000 + Date.UTC(1903, 11, 31, 4)));

                start = end;
                end = start + offset;
                const modification_time = t.parseUTCDate(buf.slice(start, end));
                
                start = end;
                offset = 4;
                end = start + offset;
                const timescale = t.parseSize(buf.slice(start, end));

                start = end;
                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                end = start + offset;
                const duration = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const rate = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const volume = buf.slice(start, end);

                start = end;
                offset = 10;
                end = start + offset;
                const reserved = buf.slice(start, end);

                start = end;
                offset = 36;
                end = start + offset;
                const matrix = buf.slice(start, end);

                start = end;
                offset = 24;
                end = start + offset;
                const pre_defined = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const next_track_ID = t.parseSize(buf.slice(start, end));
                return {
                    version,
                    creation_time,
                    modification_time,
                    timescale,
                    duration,
                    rate,
                    volume,
                    reserved,
                    matrix,
                    pre_defined,
                    next_track_ID
                };
            },
            'trak': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end));

                let head = end;
                t.trak.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                t.edts = [];
                t.mdia = [];
                t.parser['trak'](buf, len + start - offset, size, index);

                return {children: t.trak};
            },
            'tkhd': function(buf, start, size) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags
                const flags = t.parseSize(buf.slice(start, end));

                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                start = end;
                end = start + offset;
                const creation_time = t.parseUTCDate(buf.slice(start, end));

                start = end;
                end = start + offset;
                const modification_time = t.parseUTCDate(buf.slice(start, end));

                start = end;
                offset = 4;
                end = start + offset;
                const trak_ID = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const reserved1 = buf.slice(start, end);

                start = end;
                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                end = start + offset;
                const duration = t.parseSize(buf.slice(start, end));

                offset = 8;
                start = end;
                end = start + offset;
                const reserved2 = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const layer = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const alternate_group = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const volume = buf.slice(start, end);

                start = end;
                end = start + offset;
                const reserved3 = buf.slice(start, end);

                start = end;
                offset = 36;
                end = start + offset;
                const matrix = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const width = t.parseFloatFromByte(buf.slice(start, end));

                start = end;
                end = start + offset;
                const height = t.parseFloatFromByte(buf.slice(start, end));

                return {
                    version,
                    flags,
                    creation_time,
                    modification_time,
                    trak_ID,
                    reserved1,
                    duration,
                    reserved2,
                    layer,
                    alternate_group,
                    volume,
                    reserved3,
                    matrix,
                    width,
                    height
                };
            },
            'edts': function(buf, start, size) {
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end));

                if(len < size) {
                    t.edts.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len)));
                    // t.parser['edts'](buf, len + start - offset, size);
                }

                return {children: t.edts};
            },
            'elst': function(buf, start, size) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));
                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));
                // console.log(entry_count, buf.slice(start, end));
                
                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    if(version === 0) {
                        offset = 4;
                    }else{
                        offset = 8;
                    }
                    
                    start = end;
                    end = start + offset;
                    let segment_duration = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    let media_time = t.parseSize(buf.slice(start, end));

                    start = end;
                    offset = 2;
                    end = start + offset;
                    let media_rate_integer = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    let media_rate_fraction = t.parseSize(buf.slice(start, end));
                    
                    entry.push({segment_duration, media_time, media_rate_integer, media_rate_fraction});
                }

                return {
                    version, entry_count, entry
                }
            },
            'mdia': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end));

                let head = end;
                t.mdia.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                t.minf = [];
                t.parser['mdia'](buf, len + start - offset, size, index);

                return {children: t.mdia};
            },
            'mdhd': function(buf, start, size) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));
                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                end = start + offset;
                const creation_time = t.parseUTCDate(buf.slice(start, end));

                start = end;
                end = start + offset;
                const modification_time = t.parseUTCDate(buf.slice(start, end));

                start = end;
                offset = 4;
                end = start + offset;
                const timescale = t.parseSize(buf.slice(start, end));

                start = end;
                if(version === 0) {
                    offset = 4;
                }else{
                    offset = 8;
                }
                end = start + offset;
                const duration = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 2;
                end = start + offset;
                const language = t.parseType(buf.slice(start, end));

                start = end;
                end = start + offset;
                const pre_defined = buf.slice(start, end);

                return {
                    version, creation_time, modification_time, timescale, duration, language, pre_defined
                }
            },
            'hdlr': function(buf, start, size) {
                const tail = size + start - 8;
                let offset = 4;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, start + 1));

                start = end;
                end = start + offset;
                const pre_defined = buf.slice(start, end);

                start = end;
                end = start + offset;
                const handler_type = t.parseType(buf.slice(start, end));
                t.trak_handler_type = handler_type;

                start = end;
                offset = 12;
                end = start + offset;
                const reserved = buf.slice(start, end);

                start = end;
                end = tail;
                const name = t.parseType(buf.slice(start, end));

                return {
                    version, pre_defined, handler_type, reserved, name
                }
            },
            'minf': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end)).trim();

                let head = end;
                t.minf.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                t.dinf = [];
                t.stbl = [];
                t.parser['minf'](buf, len + start - offset, size, index);

                return {children: t.minf};
            },
            'vmhd': function(buf, start, size, index) {
                // const tail = size + start - 8;
                let offset = 4;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, start + 1));

                start = end;
                offset = 2;
                end = start + offset;
                const graphicsmode = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 6;
                end = start + offset;
                const opcolor = buf.slice(start, end);

                return {
                    version, graphicsmode, opcolor
                }
            },
            'dinf': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                const offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end)).trim();

                let head = end;
                t.dinf.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                t.dref = [];

                return {children: t.dinf};
            },
            'dref': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                let offset = 8;
                let end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    offset = 4;
                    end = start + offset;
                    const len = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const type = t.parseType(buf.slice(start, end)).trim();

                    t.dref.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len)));
                }

                return {child: t.dref};
            },
            'url': function(buf, start, size) {
                let offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                if(len === 1) {
                    return {location: ''};
                }
                return '';
            },
            'stbl': function(buf, start, size, index) {
                const tail = size + index - 8;
                if(start >= tail) return;
                let offset = 4;
                let end = start + offset;
                const len = t.parseSize(buf.slice(start, end));
                
                start = end;
                end = end + offset;
                let type = t.parseType(buf.slice(start, end)).trim();

                let head = end;
                t.stbl.push(Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head)));
                // t.dref = [];
                t.parser['stbl'](buf, len + start - offset, size, index);

                return {children: t.stbl};
            },
            'stsd': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));
                const value = buf.slice(start, start + 8);
                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));
                // console.log(entry_count, buf.slice(start, end));
                
                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    offset = 4;
                    end = start + offset;
                    const len = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const type = t.parseType(buf.slice(start, end)).trim();

                    start = end;
                    offset = 6;
                    end = start + offset;
                    const reserved = buf.slice(start, end);

                    start = end;
                    offset = 2;
                    end = start + offset;
                    const data_reference_index = buf.slice(start, end);

                    let head = end;
                    // console.log(len, type, reserved, data_reference_index)
                    let sampleEntry = {};
                    switch (t.trak_handler_type) {
                        case 'vide': sampleEntry = t.parser.visualSampleEntry(buf, end, len, head);break;
                        case 'soun': sampleEntry = t.parser.audioSampleEntry(buf, end, len, head);break;
                    }

                    entry.push({size: len, type, reserved, data_reference_index, sampleEntry});
                }
                return {children: entry, value};
                // console.log(entry);
            },
            'visualSampleEntry': function(buf, start, size, index) {
                let offset = 2;
                let end = start + offset;
                const pre_defined1 = buf.slice(start, end);

                start = end;
                end = start + offset;
                const reserved1 = buf.slice(start, end);

                start = end;
                offset = 12;
                end = start + offset;
                const pre_defined2 = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const width = buf.slice(start, end);

                start = end;
                end = start + offset;
                const height = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const horizresolution = buf.slice(start, end);

                start = end;
                end = start + offset;
                const vertresolution = buf.slice(start, end);

                start = end;
                end = start + offset;
                const reserved2 = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const frame_count = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 32;
                end = start + offset;
                const compressorname = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const depth = buf.slice(start, end);

                start = end;
                end = start + offset;
                const pre_defined3 = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const len = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const type = t.parseType(buf.slice(start, end));

                let head = end;
                const children = Object.assign({}, {size: len, type}, t.parser[type](buf, end, len, head));

                return {
                    width,
                    height,
                    horizresolution,
                    vertresolution,
                    frame_count,
                    compressorname,
                    depth,
                    pre_defined3,
                    children
                }

            },
            'avcC': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const configurationVersion = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const AVCProfileIndication = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const profile_compatibility = t.parseSize(buf.slice(start, end));
                
                start = end;
                end = start + offset;
                const AVCLevelIndication = t.parseSize(buf.slice(start, end));
                
                start = end;
                offset = 1;
                end = start + offset;
                const reserved1 = t.parseSize(buf.slice(start, end)).toString(2);
                const lengthSizeMinusOne = parseInt(reserved1.slice(-2), 2);

                start = end;
                end = start + offset;
                const reserved2 = t.parseSize(buf.slice(start, end)).toString(2);
                const numOfSequenceParameterSets = parseInt(reserved2.slice(-5), 2);

                const sequenceSets = [];
                for(let i = 0; i < numOfSequenceParameterSets; i++) {
                    start = end;
                    offset = 2;
                    end = start + offset;
                    const sequenceParameterSetLength = t.parseSize(buf.slice(start, end));
                    
                    start = end;
                    end = start + sequenceParameterSetLength;
                    const sequenceParameterSetNALUnit = buf.slice(start, end);

                    sequenceSets.push({sequenceParameterSetLength, sequenceParameterSetNALUnit});
                }

                start = end;
                offset = 1;
                end = start + offset;
                const numOfPictureParameterSets = t.parseSize(buf.slice(start, end));
                const pictureSets = [];
                for(let i = 0; i < numOfPictureParameterSets; i++) {
                    start = end;
                    offset = 2;
                    end = start + offset;
                    const pictureParameterSetLength = t.parseSize(buf.slice(start, end));
                    
                    start = end;
                    end = start + pictureParameterSetLength;
                    const pictureParameterSetNALUnit = buf.slice(start, end);

                    pictureSets.push({pictureParameterSetLength, pictureParameterSetNALUnit});
                }
                return {
                    configurationVersion,
                    AVCProfileIndication,
                    profile_compatibility,
                    AVCLevelIndication,
                    reserved1,
                    lengthSizeMinusOne,
                    reserved2,
                    numOfSequenceParameterSets,
                    sequenceSets,
                    pictureSets
                }
            },
            'audioSampleEntry': function(buf, start, size, index) {
                let offset = 8;
                let end = start + offset;
                const reserved1 = buf.slice(start, end);

                start = end;
                offset = 2;
                end = start + offset;
                const channelcount = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const samplesize = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const pre_defined = buf.slice(start, end);

                start = end;
                end = start + offset;
                const reserved2 = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const samplerate = buf.slice(start, end);

                start = end;
                offset = 4;
                end = start + offset;
                const len = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const type = t.parseType(buf.slice(start, end));

                const esds = buf.slice(end, start - offset + len);
                const children = Object.assign({}, {size: len, type}, {value: esds});
                
                return {
                    channelcount,
                    samplesize,
                    samplerate,
                    children
                }
            },
            'stts': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    end = start + offset;
                    const sample_count = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const sample_delta = t.parseSize(buf.slice(start, end));

                    entry.push({sample_count, sample_delta});
                }

                return {entry}
            },
            'stss': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    end = start + offset;
                    const sample_number = t.parseSize(buf.slice(start, end));

                    entry.push({sample_number});
                }

                return {entry}
            },
            'ctts': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    end = start + offset;
                    const sample_count = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const sample_offset = t.parseSize(buf.slice(start, end));

                    entry.push({sample_count, sample_offset});
                }

                return {entry}
            },
            'stsc': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    end = start + offset;
                    const first_chunk = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const samples_per_chunk = t.parseSize(buf.slice(start, end));

                    start = end;
                    end = start + offset;
                    const sample_description_index = t.parseSize(buf.slice(start, end));

                    entry.push({first_chunk, samples_per_chunk, sample_description_index});
                }

                return {entry}
            },
            'stsz': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_size = t.parseSize(buf.slice(start, end));

                start = end;
                end = start + offset;
                const sample_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                if(entry_size === 0) {
                    for(let i = 0; i < sample_count; i++) {
                        start = end;
                        end = start + offset;
                        const entry_size = t.parseSize(buf.slice(start, end));

                        entry.push({entry_size});
                    }
                }
                
                return {entry}
            },
            'stco': function(buf, start, size, index) {
                let offset = 1;
                let end = start + offset;
                const version = t.parseSize(buf.slice(start, end));

                start = end;
                offset = 3;
                end = start + offset; // flags

                start = end;
                offset = 4;
                end = start + offset;
                const entry_count = t.parseSize(buf.slice(start, end));

                const entry = [];
                for(let i = 0; i < entry_count; i++) {
                    start = end;
                    end = start + offset;
                    const chunk_offset = t.parseSize(buf.slice(start, end));

                    entry.push({chunk_offset});
                }
            
                return {entry}
            },
            'pasp': function() {},
            'btrt': function() {},
            'smhd': function() {},
            'tref': function(buf, start, size, index) {
                return {value: buf.slice(start, start + size - 8)};
            },
            'hmhd': function(buf, start, size, index) {},
            'udta': function(buf, start, size, index) {
                return {value: buf.slice(start, start + size - 8)};
            },
            'free': function() {},
            'iods': function() {},
            'mdat': function(buf, start, size, index) {
                // return {value: buf.slice(start, start + size)};
                return [];
            }
        }

        this.results = [];
        this.moov = [];
        this.trak = [];
        this.edts = [];
        this.mdia = [];
        this.minf = [];
        this.dinf = [];
        this.dref = [];
        this.stbl = [];
        this.trak_handler_type = '';
        // this.stsd = [];
    }
    
    // 解析box类型，buffer转字符串
    parseType(buf) {
        return buf.reduce(function(a, b){return a + String.fromCharCode(b);}, '');
    }
    // 解析box长度，buffer转数字
    parseSize(buf) {
        return parseInt(buf.reduce(function(a, b){
            let res = Number(b).toString(16);
            if(res === '0') {
                res = '00';
            }else if(res.length < 2) {
                res = '0' + res;
            }
            return a + res;
        }, ''), 16);
    }

    // 16转10进制
    _16to10(buf) {
        return parseInt(buf.join(''), 16);
    }

    // 解析UTC类型
    parseUTCDate(buf) {
        return new Date(this.parseSize(buf)*1000 + Date.UTC(1904, 0, 1, 0, 0, 0, 0));
    }
    // 解析浮点型数据
    parseFloatFromByte(buf) {
        let end = buf.length / 2;
        let intPart = this.parseSize(buf.slice(0, end));
        let decPart = this.parseSize(buf.slice(end, buf.length));
        return [intPart, decPart].join('.');
    }
    // 按参数len分割buffer数组
    cutArray(array, len) {
        const res = [];
        let ary = [];
        array.map(function(a, i){
            if(i % len === 0){
                ary = [];
            }
            ary.push(a);
            if(ary.length === len) {
                res.push(ary);
            }
            
        });
        return res;
    }
    // 解析box
    parseBoxs(array, start, length) {
        // let start = 0;
        let offset = 4;
        let end = start + offset;
        const size = this.parseSize(array.slice(start, end));

        start = end;
        end = end + offset;
        const type = this.parseType(array.slice(start, end));
        // console.log(start, size, type, length)
        let index = end;
        if(size < length) {
            this.results.push(Object.assign({}, {size, type}, this.parser[type](array, end, size, index)));
            return this.parseBoxs(array, size + start - offset, length);
        }else {
            return this.results;
        }
    }
}