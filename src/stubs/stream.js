// Browser stub for Node.js 'stream' module.
// xlsx-js-style's dist bundle checks stream.Readable at init time but only
// uses it when the caller actually pipes data — never happens in browser mode.
export default {};
export class Readable {}
export class Writable {}
export class Transform {}
export class PassThrough {}
