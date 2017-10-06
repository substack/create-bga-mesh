# create-bga-mesh

generate a [bga mesh file][]

[bga mesh]: https://substack.neocities.org/bga.html

# example

turn a simplicial complex json file (like [bunny][] or [teapot][])
into a BGA file:

``` js
var createBGA = require('')
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
* opts.attributes - object mapping vertex names to records (see below)
* opts.edges - flat or nested array of edge vertex indices
* opts.edgeType - `'uint16'` or `'uint32'`.
  Set to uint32 if not set and `>65535` vertices.
* opts.triangles - flat or nested array of triangle vertex indices
* opts.triangleType - `'uint16'` or `'uint32'`
  Set to uint32 if not set and `>65535` vertices.

Each attribute value in the `opts.attributes` object should have:

* attr.type - a glsl type string (float, vec2, vec3, etc)
* attr.data - a flat or nested array of attribute data

# install

```
npm install create-bga-mesh
```

# license

BSD
