var tou8 = require('utf8-to-uint8array')
var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint16: 2, uint32: 4
}
var counts = {
  float: 1, vec2: 2, vec3: 3, vec4: 4,
  mat2: 4, mat3: 9, mat4: 16
}

module.exports = function (opts) {
  var attrs = opts.attributes
  var attrKeys = Object.keys(attrs)
  var attrIsFlat = {}, attrSize = {}, attrCount = {}
  for (var i = 0; i < attrKeys.length; i++) {
    var key = attrKeys[i]
    attrIsFlat[key] = !Array.isArray(attrs[key].data[0])
    attrSize[key] = sizes[attrs[key].type]
    attrCount[key] = counts[attrs[key].type]
  }
  var firstAttr = attrs[attrKeys[0]]
  var vcount = Array.isArray(firstAttr.data)
    ? firstAttr.data.length : firstAttr.data.length / sizes[firstAttr.type]
  var edges = opts.edges || []
  var ecount = Array.isArray(edges[0])
    ? edges.length : edges.length / 3
  var etype = opts.edgeType !== undefined
    ? opts.edgeType : (vcount > 65535 ? 'uint32' : 'uint16')
  var triangles = opts.triangles || []
  var tcount = Array.isArray(triangles[0])
    ? triangles.length : triangles.length / 3
  var ttype = opts.triangleType !== undefined
    ? opts.triangleType : (vcount > 65535 ? 'uint32' : 'uint16')
  var littleEndian = opts.endian === 'little'
  var header = tou8([
    'BGA 1.0',
    opts.endian + ' endian',
    attrKeys.map(function (key) {
      return 'attribute ' + attrs[key].type + ' ' + key
    }).join('\n'),
    vcount + ' vertex',
    ecount + ' edge ' + etype,
    tcount + ' triangle ' + ttype,
    '\n'
  ].join('\n'))
  var vsize = 0
  for (var i = 0; i < attrKeys.length; i++) {
    vsize += sizes[attrs[attrKeys[i]].type]
  }
  var esize = sizes[etype]
  var tsize = sizes[ttype]
  var data = new Uint8Array(header.length
    + vsize*vcount + esize*2*ecount + tsize*3*tcount)
  var dv = new DataView(data.buffer)
  for (var i = 0; i < header.length; i++) {
    data[i] = header[i]
  }
  var offset = header.length
  // vertices
  for (var i = 0; i < vcount; i++) {
    for (var j = 0; j < attrKeys.length; j++) {
      var key = attrKeys[j]
      var r = attrs[key]
      if (attrIsFlat[key] === true) {
        for (var k = 0; k < attrCount[key]; k++) {
          dv.setFloat32(offset, r.data[i*4+k], littleEndian)
          offset += 4
        }
      } else {
        for (var k = 0; k < attrCount[key]; k++) {
          dv.setFloat32(offset, r.data[i][k], littleEndian)
          offset += 4
        }
      }
    }
  }
  // edges
  var flatEdges = !Array.isArray(edges[0])
  if (etype === 'uint16' && flatEdges) {
    for (var i = 0; i < ecount; i++) {
      dv.setUint16(offset, edges[i*2+0], littleEndian)
      offset += 2
      dv.setUint16(offset, edges[i*2+1], littleEndian)
      offset += 2
    }
  } else if (etype === 'uint16') {
    for (var i = 0; i < ecount; i++) {
      dv.setUint16(offset, edges[i][0], littleEndian)
      offset += 2
      dv.setUint16(offset, edges[i][1], littleEndian)
      offset += 2
    }
  } else if (etype === 'uint32' && flatEdges) {
    for (var i = 0; i < ecount; i++) {
      dv.setUint32(offset, edges[i*2+0], littleEndian)
      offset += 4
      dv.setUint32(offset, edges[i*2+1], littleEndian)
      offset += 4
    }
  } else if (etype === 'uint32') {
    for (var i = 0; i < ecount; i++) {
      dv.setUint32(offset, edges[i*2+0], littleEndian)
      offset += 4
      dv.setUint32(offset, edges[i*2+1], littleEndian)
      offset += 4
    }
  }
  // triangles
  var flatTriangles = !Array.isArray(triangles[0])
  if (ttype === 'uint16' && flatTriangles) {
    for (var i = 0; i < tcount; i++) {
      dv.setUint16(offset, triangles[i*3+0], littleEndian)
      offset += 2
      dv.setUint16(offset, triangles[i*3+1], littleEndian)
      offset += 2
      dv.setUint16(offset, triangles[i*3+2], littleEndian)
      offset += 2
    }
  } else if (ttype === 'uint16') {
    for (var i = 0; i < tcount; i++) {
      dv.setUint16(offset, triangles[i][0], littleEndian)
      offset += 2
      dv.setUint16(offset, triangles[i][1], littleEndian)
      offset += 2
      dv.setUint16(offset, triangles[i][2], littleEndian)
      offset += 2
    }
  } else if (ttype === 'uint32' && flatTriangles) {
    for (var i = 0; i < tcount; i++) {
      dv.setUint32(offset, triangles[i*3+0], littleEndian)
      offset += 4
      dv.setUint32(offset, triangles[i*3+1], littleEndian)
      offset += 4
      dv.setUint32(offset, triangles[i*3+2], littleEndian)
      offset += 4
    }
  } else if (ttype === 'uint32') {
    for (var i = 0; i < tcount; i++) {
      dv.setUint32(offset, triangles[i][0], littleEndian)
      offset += 4
      dv.setUint32(offset, triangles[i][1], littleEndian)
      offset += 4
      dv.setUint32(offset, triangles[i][2], littleEndian)
      offset += 4
    }
  }
  return data
}
