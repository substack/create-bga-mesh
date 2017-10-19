# create-bga-mesh

generate a [bga mesh file][]

[bga mesh]: https://substack.neocities.org/bga.html

# example

turn a simplicial complex json file (like [bunny][] or [teapot][])
into a BGA file:

``` js
var createBGA = require('create-bga-mesh')
var mesh = require('teapot')

process.stdout.write(Buffer.from(createBGA({
  endian: 'little',
  buffers: [
    { type: 'vec3', name: 'vertex.position', data: mesh.positions },
    { type: 'uint32[3]', name: 'triangle.cell', data: mesh.cells }
  ]
})))
```

[bunny]: https://npmjs.com/package/bunny
[teapot]: https://npmjs.com/package/teapot

# api

``` js
var createBGA = require('create-bga-mesh')
```

## var data = createBGA(opts)

Return a Uint8Array `data` from:

* opts.endian - `'little'` or `'big'`
* opts.buffers - array of buffer records (see below)

Each `buffer` in the `opts.buffers` array should have:

* `buffer.name` - string "BUFNAME.VARNAME" describing the buffer and variable
  name to use separated by a dot
* `buffer.type` - string type name. One of: float, vec2, vec3, vec4, mat2, mat3,
  mat4, uint8, uint16, uint32, int8, int16, int32.
  Optionally provide a `[n]` quantity at the end of the string.
* `buffer.data` - flat array of array nested by quantity (or quanity implied by
  vector or matrix type)

# install

```
npm install create-bga-mesh
```

# license

BSD
