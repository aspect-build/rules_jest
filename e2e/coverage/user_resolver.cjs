// A user-supplied Jest resolver that just delegates to the default resolver.
// On jest 30 the default resolver realpaths symlinks, so without rules_jest
// composing `symlinks: false` on top of it, coverage attribution breaks
// (rules_js #2901) even though the test passes.
module.exports = (request, options) =>
  options.defaultResolver(request, options);
