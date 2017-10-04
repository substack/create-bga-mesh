var teapot = require('teapot')
var createBGA = require('../')

process.stdout.write(Buffer.from(createBGA({
  endian: 'little',
  attributes: {
    position: {
      type: 'vec3',
      data: teapot.positions
    }
  },
  triangles: teapot.cells
})))
