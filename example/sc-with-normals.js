var createBGA = require('../')
var anormals = require('angle-normals')
var fs = require('fs')

var file = process.argv[2]
var mesh = JSON.parse(fs.readFileSync(file,'utf8'))
var normals = anormals(mesh.cells, mesh.positions)

process.stdout.write(Buffer.from(createBGA({
  endian: 'little',
  buffers: [
    { type: 'vec3', name: 'vertex.position', data: mesh.positions },
    { type: 'vec3', name: 'vertex.normal', data: normals },
    { type: 'uint32[3]', name: 'triangle.cell', data: mesh.cells }
  ]
})))
