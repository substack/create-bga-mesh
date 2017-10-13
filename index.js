var tou8 = require('utf8-to-uint8array')
var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint16: 2, uint32: 4
}
var counts = {
  uint8: 1, uint16: 1, uint32: 1,
  float: 1, vec2: 2, vec3: 3, vec4: 4,
  mat2: 4, mat3: 9, mat4: 16
}

module.exports = function (opts) {
  var endian = opts.endian
  if (endian !== 'little' && endian !== 'big') {
    throw new Error('endian must be "big" or "little"')
  }
  var littleEndian = endian === 'little'
  var buffers = opts.buffers || []
  var headerLines = [
    'BGA 2.0',
    endian + ' endian'
  ]
  var bufferGroups = {}, countOrder = [], bufferNames = []
  var lengths = {}, isFlat = {}
  var dataSize = 0
  for (var i = 0; i < buffers.length; i++) {
    var b = buffers[i]
    var ix = b.name.indexOf('.')
    var bufname = ix >= 0 ? b.name.substring(0,ix) : b.name
    var first = !bufferGroups.hasOwnProperty(bufname)
    if (first) bufferGroups[bufname] = []
    bufferGroups[bufname].push({
      type: b.type,
      name: ix >= 0 ? b.name.substring(ix) : '',
      data: b.data
    })
    ix = b.type.indexOf('[')
    var type = ix >= 0 ? b.type.substring(ix,0) : b.type
    var quantity = ix >= 0 ? b.type.substring(ix) : ''
    headerLines.push(type + ' ' + b.name + quantity)
    var len
    if (first) {
      len = lengths[bufname] = getCount(type, b.data)
      countOrder.push(len + ' ' + bufname)
      bufferNames.push(bufname)
    } else {
      len = lengths[bufname]
    }
    dataSize += sizes[type] * len
  }
  for (var i = 0; i < countOrder.length; i++) {
    headerLines.push(countOrder[i])
  }
  headerLines.push('\n')

  var header = tou8(headerLines.join('\n'))
  dataSize += header.length
  var data = new Uint8Array(dataSize)
  var dv = new DataView(data.buffer)
  for (var i = 0; i < header.length; i++) {
    data[i] = header[i]
  }
  var offset = header.length

  for (var i = 0; i < bufferNames.length; i++) {
    var bufname = bufferNames[i]
    var group = bufferGroups[bufname]
    var len = lengths[bufname]
    for (var j = 0; j < len; j++) {
      for (var k = 0; k < group.length; k++) {
        var g = group[k]
        if (b.type === 'uint8') {
          dv.setUint8(offset, g.data[j], littleEndian)
          offset += 1
        } else if (b.type === 'uint16') {
          dv.setUint16(offset, g.data[j], littleEndian)
          offset += 2
        } else if (b.type === 'uint32') {
          dv.setUint32(offset, g.data[j], littleEndian)
          offset += 4
        } else {
          var c = counts[g.type]
          for (var n = 0; n < c; n++) {
            dv.setFloat32(offset, g.data[j*c+n], littleEndian)
            offset += 4
          }
        }
      }
    }
  }
  return data
}

function getCount (type, data) {
  var isFlat = data.length > 0 && !Array.isArray(data[0])
  return isFlat ? data.length / counts[type] : data.length
}
