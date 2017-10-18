var tou8 = require('utf8-to-uint8array')
var lcm = require('lcm')
var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint8: 1, uint16: 2, uint32: 4,
  int8: 1, int16: 2, int32: 4
}
var qsizes = {
  float: 4, vec2: 4, vec3: 4, vec4: 4,
  mat2: 4, mat3: 4, mat4: 4,
  uint8: 1, uint16: 2, uint32: 4,
  int8: 1, int16: 2, int32: 4
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
  var lengths = {}
  var dataSize = 0
  for (var i = 0; i < buffers.length; i++) {
    var b = buffers[i]
    var ix = b.name.indexOf('.')
    var bufname = ix >= 0 ? b.name.substring(0,ix) : b.name
    var varname = ix >= 0 ? b.name.substring(ix+1) : ''
    ix = b.type.indexOf('[')
    var type = ix >= 0 ? b.type.substring(ix,0) : b.type
    var strQuantity = ix >= 0 ? b.type.substring(ix) : ''
    var quantity = ix >= 0
      ? Number(b.type.substring(ix+1,b.type.length-1)) : 1
    headerLines.push(type + ' ' + b.name + strQuantity)
    var len
    var first = !bufferGroups.hasOwnProperty(bufname)
    if (first) {
      bufferGroups[bufname] = []
      len = lengths[bufname] = getCount(type, b.data)
      countOrder.push(len + ' ' + bufname)
      bufferNames.push(bufname)
    } else {
      len = lengths[bufname]
    }
    bufferGroups[bufname].push({
      type: type,
      name: varname,
      quantity: quantity,
      flat: !Array.isArray(b.data[0]),
      data: b.data
    })
    dataSize += sizes[type] * quantity * len
  }
  for (var i = 0; i < countOrder.length; i++) {
    headerLines.push(countOrder[i])
  }
  headerLines.push('\n')

  var header = tou8(headerLines.join('\n'))
  dataSize += header.length
  var offset = header.length
  var padding = {}
  for (var i = 0; i < bufferNames.length; i++) {
    var bufname = bufferNames[i]
    var group = bufferGroups[bufname]
    var factor = 1
    var len = 0
    for (var k = 0; k < group.length; k++) {
      var g = group[k]
      factor = lcm(factor,qsizes[g.type])
      len += qsizes[g.type] * g.data.length
        * (g.flat ? 1 : counts[g.type])
    }
    var pad = (factor - (offset % factor)) % factor
    padding[bufname] = pad
    offset += pad + len
    dataSize += pad
  }

  var data = new Uint8Array(dataSize)
  var dv = new DataView(data.buffer)
  for (var i = 0; i < header.length; i++) {
    data[i] = header[i]
  }
  offset = header.length

  for (var i = 0; i < bufferNames.length; i++) {
    var bufname = bufferNames[i]
    var group = bufferGroups[bufname]
    var len = lengths[bufname]
    var pad = padding[bufname]
    for (var j = 0; j < pad; j++) {
      dv.setUint8(offset, 0, littleEndian)
      offset += 1
    }
    for (var j = 0; j < len; j++) {
      for (var k = 0; k < group.length; k++) {
        var g = group[k]
        if (g.type === 'uint8' && g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint8(offset, g.data[g.quantity*j+m], littleEndian)
            offset += 1
          }
        } else if (g.type === 'uint8' && !g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint8(offset, g.data[j][m], littleEndian)
            offset += 1
          }
        } else if (g.type === 'uint16' && g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint16(offset, g.data[g.quantity*j+m], littleEndian)
            offset += 2
          }
        } else if (g.type === 'uint16' && !g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint16(offset, g.data[j*g.quantity], littleEndian)
            offset += 2
          }
        } else if (g.type === 'uint16' && !g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint16(offset, g.data[j][m], littleEndian)
            offset += 2
          }
        } else if (g.type === 'uint32' && g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint32(offset, g.data[g.quantity*j+m], littleEndian)
            offset += 4
          }
        } else if (g.type === 'uint32' && !g.flat) {
          for (var m = 0; m < g.quantity; m++) {
            dv.setUint32(offset, g.data[j][m], littleEndian)
            offset += 4
          }
        } else if (g.flat) {
          var c = counts[g.type]
          for (var m = 0; m < g.quantity; m++) {
            for (var n = 0; n < c; n++) {
              dv.setFloat32(offset, g.data[j*c*g.quantity+m*c+n], littleEndian)
              offset += 4
            }
          }
        } else if (!g.flat) {
          var c = counts[g.type]
          for (var m = 0; m < g.quantity; m++) {
            for (var n = 0; n < c; n++) {
              dv.setFloat32(offset, g.data[j*g.quantity+m][n], littleEndian)
              offset += 4
            }
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
