var createBGA = require('../')
var fs = require('fs')
var file = process.argv[2]
var mesh = JSON.parse(fs.readFileSync(file,'utf8'))

process.stdout.write(Buffer.from(createBGA({
  endian: 'little',
  attributes: {
    position: {
      type: 'vec3',
      data: mesh.positions
    }
  },
  triangles: mesh.cells
})))
