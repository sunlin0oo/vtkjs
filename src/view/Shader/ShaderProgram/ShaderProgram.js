import macro from '@kitware/vtk.js/macros.js';
import vtkShader from '../Shader/Shader.js';

var vtkErrorMacro = macro.vtkErrorMacro; // perform in place string substitutions, indicate if a substitution was done
// this is useful for building up shader strings which typically involve
// lots of string substitutions. Return true if a substitution was done.

function substitute(source, search, replace) {
  var all = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  var replaceStr = Array.isArray(replace) ? replace.join('\n') : replace;
  var replaced = false;

  if (source.search(search) !== -1) {
    replaced = true;
  }

  var gflag = '';

  if (all) {
    gflag = 'g';
  }

  var regex = new RegExp(search, gflag);
  var resultstr = source.replace(regex, replaceStr);
  return {
    replace: replaced,
    result: resultstr
  };
} // ----------------------------------------------------------------------------
// vtkShaderProgram methods
// ----------------------------------------------------------------------------

// 通过调用newInstance方法传参来设置属性
function vtkShaderProgram(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShaderProgram');

  publicAPI.compileShader = function () {
    if (!model.vertexShader.compile()) {
      vtkErrorMacro(model.vertexShader.getSource().split('\n').map(function (line, index) {
        return "".concat(index, ": ").concat(line);
      }).join('\n'));
      vtkErrorMacro(model.vertexShader.getError());
      return 0;
    }

    if (!model.fragmentShader.compile()) {
      vtkErrorMacro(model.fragmentShader.getSource().split('\n').map(function (line, index) {
        return "".concat(index, ": ").concat(line);
      }).join('\n'));
      vtkErrorMacro(model.fragmentShader.getError());
      return 0;
    } // skip geometry for now

    if (!publicAPI.attachShader(model.vertexShader)) {
      vtkErrorMacro(model.error);
      return 0;
    }

    if (!publicAPI.attachShader(model.fragmentShader)) {
      vtkErrorMacro(model.error);
      return 0;
    }

    if (!publicAPI.link()) {
      vtkErrorMacro("Links failed: ".concat(model.error));
      return 0;
    }

    publicAPI.setCompiled(true);
    return 1;
  };

  publicAPI.cleanup = function () {
    if (model.shaderType === 'Unknown' || model.handle === 0) {
      return;
    }

    model.context.deleteShader(model.handle);
    model.handle = 0;
  };

  publicAPI.bind = function () {
    if (!model.linked && !publicAPI.link()) {
      return false;
    }

    model.context.useProgram(model.handle);
    publicAPI.setBound(true);
    return true;
  };

  publicAPI.isBound = function () {
    return !!model.bound;
  };

  publicAPI.release = function () {
    model.context.useProgram(null);
    publicAPI.setBound(false);
  };

  publicAPI.setContext = function (ctx) {
    model.vertexShader.setContext(ctx);
    model.fragmentShader.setContext(ctx);
    model.geometryShader.setContext(ctx);
  };

  publicAPI.link = function () {
    // console.log('model of link', model);
    if (model.inked) {
      return true;
    }

    if (model.handle === 0) {
      model.error = 'Program has not been initialized, and/or does not have shaders.';
      return false;
    } // clear out the list of uniforms used

    model.uniformLocs = {};
    model.context.linkProgram(model.handle);
    // 此处出错==>Error linking shader The program must contain objects to form both a vertex and fragment shader.
    // console.log('model.handle', model.handle,'model.context.LINK_STATUS',model.context.LINK_STATUS);
    var isCompiled = model.context.getProgramParameter(model.handle, model.context.LINK_STATUS);

    if (!isCompiled) {
      var lastError = model.context.getProgramInfoLog(model.handle);
      vtkErrorMacro("Error linking shader :::".concat(lastError));
      model.handle = 0;
      return false;
    }

    publicAPI.setLinked(true);
    model.attributeLocs = {};
    return true;
  };

  publicAPI.setUniformMatrix = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    var f32 = new Float32Array(v);
    model.context.uniformMatrix4fv(location, false, f32);
    return true;
  };

  publicAPI.setUniformMatrix3x3 = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    var f32 = new Float32Array(v);
    model.context.uniformMatrix3fv(location, false, f32);
    return true;
  };

  publicAPI.setUniformf = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform1f(location, v);
    return true;
  };

  publicAPI.setUniformfv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform1fv(location, v);
    return true;
  };

  publicAPI.setUniformi = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform1i(location, v);
    return true;
  };

  publicAPI.setUniformiv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform1iv(location, v);
    return true;
  };

  publicAPI.setUniform2f = function (name, v1, v2) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    if (v2 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform2f(location, v1, v2);
    return true;
  };

  publicAPI.setUniform2fv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform2fv(location, v);
    return true;
  };

  publicAPI.setUniform2i = function (name, v1, v2) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    if (v2 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform2i(location, v1, v2);
    return true;
  };

  publicAPI.setUniform2iv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform2iv(location, v);
    return true;
  };

  publicAPI.setUniform3f = function (name, a1, a2, a3) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    if (a3 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform3f(location, a1, a2, a3);
    return true;
  };

  publicAPI.setUniform3fArray = function (name, a) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    if (!Array.isArray(a) || a.length !== 3) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform3f(location, a[0], a[1], a[2]);
    return true;
  };

  publicAPI.setUniform3fv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform3fv(location, v);
    return true;
  };

  publicAPI.setUniform3i = function (name) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var array = args; // allow an array passed as a single argument

    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }

    if (array.length !== 3) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform3i(location, array[0], array[1], array[2]);
    return true;
  };

  publicAPI.setUniform3iv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform3iv(location, v);
    return true;
  };

  publicAPI.setUniform4f = function (name) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var array = args; // allow an array passed as a single argument

    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }

    if (array.length !== 4) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform4f(location, array[0], array[1], array[2], array[3]);
    return true;
  };

  publicAPI.setUniform4fv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform4fv(location, v);
    return true;
  };

  publicAPI.setUniform4i = function (name) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    var array = args; // allow an array passed as a single argument

    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }

    if (array.length !== 4) {
      throw new RangeError('Invalid number of values for array');
    }

    model.context.uniform4i(location, array[0], array[1], array[2], array[3]);
    return true;
  };

  publicAPI.setUniform4iv = function (name, v) {
    var location = publicAPI.findUniform(name);

    if (location === -1) {
      model.error = "Could not set uniform ".concat(name, " . No such uniform.");
      return false;
    }

    model.context.uniform4iv(location, v);
    return true;
  };

  publicAPI.findUniform = function (name) {
    if (!name || !model.linked) {
      return -1;
    } // see if we have cached the result


    var loc = model.uniformLocs[name];

    if (loc !== undefined) {
      return loc;
    }

    loc = model.context.getUniformLocation(model.handle, name);

    if (loc === null) {
      model.error = "Uniform ".concat(name, " not found in current shader program.");
      model.uniformLocs[name] = -1;
      return -1;
    }

    model.uniformLocs[name] = loc;
    return loc;
  };

  publicAPI.isUniformUsed = function (name) {
    if (!name) {
      return false;
    } // see if we have cached the result


    var loc = model.uniformLocs[name];

    if (loc !== undefined) {
      return loc !== null;
    }

    if (!model.linked) {
      vtkErrorMacro('attempt to find uniform when the shader program is not linked');
      return false;
    }

    loc = model.context.getUniformLocation(model.handle, name);
    model.uniformLocs[name] = loc;

    if (loc === null) {
      return false;
    }

    return true;
  };

  publicAPI.isAttributeUsed = function (name) {
    if (!name) {
      return false;
    } // see if we have cached the result


    var loc = Object.keys(model.attributeLocs).indexOf(name);

    if (loc !== -1) {
      return true;
    }

    if (!model.linked) {
      vtkErrorMacro('attempt to find uniform when the shader program is not linked');
      return false;
    }

    loc = model.context.getAttribLocation(model.handle, name);

    if (loc === -1) {
      return false;
    }

    model.attributeLocs[name] = loc;
    return true;
  };

  publicAPI.attachShader = function (shader) {

    // console.log('model.vertexShadergetContext::', model.vertexShader.getContext());
    // console.log('model.vertexShadergetSource::', model.vertexShader.getSource());
    // console.log('model.vertexShadergetShaderType()::', model.vertexShader.getShaderType());


    if (shader.getHandle() === 0) {
      model.error = 'Shader object was not initialized, cannot attach it.';
      return false;
    }

    if (shader.getShaderType() === 'Unknown') {
      model.error = 'Shader object is of type Unknown and cannot be used.';
      return false;
    }

    if (model.handle === 0) {
      var thandle = model.context.createProgram();

      if (thandle === 0) {
        model.error = 'Could not create shader program.';
        return false;
      }

      model.handle = thandle;
      model.linked = false;
    }

    if (shader.getShaderType() === 'Vertex') {
      if (model.vertexShaderHandle !== 0) {
        model.comntext.detachShader(model.handle, model.vertexShaderHandle);
      }

      model.vertexShaderHandle = shader.getHandle();
    }

    if (shader.getShaderType() === 'Fragment') {
      if (model.fragmentShaderHandle !== 0) {
        model.context.detachShader(model.handle, model.fragmentShaderHandle);
      }

      model.fragmentShaderHandle = shader.getHandle();
    }

    model.context.attachShader(model.handle, shader.getHandle());
    console.log('model of attachShader', model);
    publicAPI.setLinked(false);
    return true;
  };

  publicAPI.detachShader = function (shader) {
    if (shader.getHandle() === 0) {
      model.error = 'shader object was not initialized, cannot attach it.';
      return false;
    }

    if (shader.getShaderType() === 'Unknown') {
      model.error = 'Shader object is of type Unknown and cannot be used.';
      return false;
    }

    if (model.handle === 0) {
      model.error = 'This shader program has not been initialized yet.';
    }

    switch (shader.getShaderType()) {
      case 'Vertex':
        if (model.vertexShaderHandle !== shader.getHandle()) {
          model.error = 'The supplied shader was not attached to this program.';
          return false;
        }

        model.context.detachShader(model.handle, shader.getHandle());
        model.vertexShaderHandle = 0;
        model.linked = false;
        return true;

      case 'Fragment':
        if (model.fragmentShaderHandle !== shader.getHandle()) {
          model.error = 'The supplied shader was not attached to this program.';
          return false;
        }

        model.context.detachShader(model.handle, shader.getHandle());
        model.fragmentShaderHandle = 0;
        model.linked = false;
        return true;

      default:
        return false;
    }
  };

  publicAPI.setContext = function (ctx) {
    model.context = ctx;
    model.vertexShader.setContext(ctx);
    model.fragmentShader.setContext(ctx);
    model.geometryShader.setContext(ctx);

  };

  publicAPI.setLastCameraMTime = function (mtime) {
    model.lastCameraMTime = mtime;
  }; // publicAPI.enableAttributeArray = (name) => {
  //   const location = publicAPI.findAttributeArray(name);
  //   if (location === -1) {
  //     model.error = `Could not enable attribute ${name} No such attribute.`;
  //     return false;
  //   }
  //   model.context.enableVertexAttribArray(location);
  //   return true;
  // };
  // publicAPI.disableAttributeArray = (name) => {
  //   const location = publicAPI.findAttributeArray(name);
  //   if (location === -1) {
  //     model.error = `Could not enable attribute ${name} No such attribute.`;
  //     return false;
  //   }
  //   model.context.disableVertexAttribArray(location);
  //   return true;
  // };

} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  vertexShaderHandle: 0,
  fragmentShaderHandle: 0,
  geometryShaderHandle: 0,
  vertexShader: null,
  fragmentShader: null,
  geometryShader: null,
  linked: false,
  bound: false,
  compiled: false,
  error: '',
  handle: 0,
  numberOfOutputs: 0,
  attributesLocs: null,
  uniformLocs: null,
  md5Hash: 0,
  context: null,
  lastCameraMTime: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Instantiate internal objects

  model.attributesLocs = {};
  model.uniformLocs = {};
  model.vertexShader = vtkShader.newInstance();
  model.vertexShader.setShaderType('Vertex');
  model.fragmentShader = vtkShader.newInstance();
  model.fragmentShader.setShaderType('Fragment');
  model.geometryShader = vtkShader.newInstance();
  model.geometryShader.setShaderType('Geometry'); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['lastCameraMTime']);
  macro.setGet(publicAPI, model, ['error', 'handle', 'compiled', 'bound', 'md5Hash', 'vertexShader', 'fragmentShader', 'geometryShader', 'linked']); // Object methods

  vtkShaderProgram(publicAPI, model);
} // ----------------------------------------------------------------------------


var newInstance = macro.newInstance(extend, 'vtkShaderProgram'); // ----------------------------------------------------------------------------

var vtkShaderProgram$1 = {
  newInstance: newInstance,
  extend: extend,
  substitute: substitute
};

export { vtkShaderProgram$1 as default };
