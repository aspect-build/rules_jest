// WORKAROUND - see README.md
const _defineProperty = Object.defineProperty;
Object.defineProperty = function swcEsmWorkaroundDefineProperty(
  obj,
  key,
  attrs,
) {
  if (typeof obj["__esModule"] === "boolean") {
    attrs = { ...attrs };

    if (Object.prototype.hasOwnProperty.call(attrs, "value")) {
      attrs.writable = true;
    } else {
      attrs.configurable = true;
    }
  }

  return _defineProperty.call(this, obj, key, attrs);
};
