/**
 * OvoiD.JS - WebGL Based Multimedia Middleware API
 * 
 * Copyright (C) 2011 - 2014  Eric M.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */



/**
 * Constructor method.
 * 
 * @class Animation node object.<br><br>
 * 
 * This class is a Node object inherited from <c>Ovoid.Node</c> class.<br><br>
 * 
 * The Animation node is a Constraint node who apply an prerecorded animation 
 * to one other node. Animations are composed of several curves which describes 
 * the value interpolation over the time. The Animation node is a dependency 
 * node and does not takes place directly in 
 * the 3D world. The Animation node is typically assigned to one and only one 
 * other node.<br><br>
 * 
 * <blockcode>
 * var youpi = myOvoid.Scene.newNode(Ovoid.ANIMATION, "youpiAnim");<br>
 * youpi.setCspline(Ovoid.ANIMATION_CHANNEL_ROTATE_X, keyTimes, keyValues);<br>
 * <br>
 * youpi.setTarget(box);<br>
 * youpi.play();<br>
 * </blockcode><br><br>
 * 
 * <b>Animation channels</b><br><br>
 * 
 * The Animation node acts as an attributes modifier for the targeted node. An 
 * animation channel is defined by one animation curve which modify one 
 * attribute (for example : X translation, Z Rotation, etc...). Attributes are 
 * not all currently supported, or, so to speak, can be animated.<br><br>
 * The currently implemented channels are the following ones:<br><br>
 * <ul>
 * <li>Translation X (Ovoid.ANIMATION_CHANNEL_TRANSLATE_X)</li>
 * <li>Translation Y (Ovoid.ANIMATION_CHANNEL_TRANSLATE_Y)</li>
 * <li>Translation Z (Ovoid.ANIMATION_CHANNEL_TRANSLATE_Z</li>
 * <li>Rotation (euler) X (Ovoid.ANIMATION_CHANNEL_ROTATE_X)</li>
 * <li>Rotation (euler) Y (Ovoid.ANIMATION_CHANNEL_ROTATE_Y)</li>
 * <li>Rotation (euler) Z (Ovoid.ANIMATION_CHANNEL_ROTATE_Z)</li>
 * <li>Orientation (euler) X (Ovoid.ANIMATION_CHANNEL_ORIENTE_X)</li>
 * <li>Orientation (euler) Y (Ovoid.ANIMATION_CHANNEL_ORIENTE_Y)</li>
 * <li>Orientation (euler) Z (Ovoid.ANIMATION_CHANNEL_ORIENTE_Z)</li>
 * <li>Scalling X (Ovoid.ANIMATION_CHANNEL_SCALE_X)</li>
 * <li>Scalling Y (Ovoid.ANIMATION_CHANNEL_SCALE_Y)</li>
 * <li>Scalling Z (Ovoid.ANIMATION_CHANNEL_SCALE_Z)</li>
 * </ul>
 * 
 * <b>Animation handling</b><br><br>
 * 
 * For interactivity purpose, the Animation node is designed to make able to 
 * handle the animation end through a trigger function. The <c>onended</c> 
 * trigger function member is called each time the animation ends. So you can 
 * override this function to handle the animation ends and create some 
 * interactive or scripts effects. The function should take one argument who 
 * is the Animation node itself.<br><br>
 * 
 * <blockcode>
 * var alarm = function(node) {<br>
 * &nbsp;&nbsp;window.alert("The animation " + node.name + " just ended.");
 * };<br>
 * <br>
 * animation.onended = alarm;<br>
 * </blockcode><br><br>
 * 
 * @extends Ovoid.Constraint
 *
 * @param {string} name Name of the node.
 * @param {object} i Instance object to register object to.
 */
Ovoid.Animation = function(name, i) {

  Ovoid.Constraint.call(this);
  /** node type */
  this.type |= Ovoid.ANIMATION;
  /** Node name 
   * @type string */
  this.name = name;
  /** Animation playing stat.
   * @type bool */
  this.playing = false;
  /** Animation looping stat.
   * @type bool */
  this.loop = false;
  /** Animation ended stat.
   * @type bool */
  this.ended = false;
  /** Animation smoothing flag.
   * Tell if the animation curves should be interpolated using linear or full 
   * algorythme. Linear interpolation is often sufficiant and performance 
   * saver.
   * @type bool */
  this.smooth = true;
  /** Animation playing factor.
   * Define the time factor to play and interpolate the animation. The factor 
   * can be negative to play the animation backward. For example a value of -2.0
   * will play the animation backward twice the normal speed.
   * @type float */
  this.factor = 1.0;
  /** Overridable triggered function.<br><br>
   * 
   * This function is triggered each time the animation ends.<br><br>
   * 
   * The function accepts one parameter which is the involved 'this' instance.<br><br>
   * 
   * <blockcode>
   * animation.onended = function (node) { <cc>// do something</cc> };<br>
   * </blockcode>
   * @field
   * @type Function
   */
  this.onended = function(node) {};
  /** Animation format. */
  this._format = 0;
  /** Animation channel curves */
  this._channel = new Array(21);
  /** Animation output array */
  this._output = new Float32Array(21);
  /** Animation playing time */
  this._time = 0.0;
  
  /** Ovoid.JS parent instance
   * @type Object */
  this._i = i;
};
Ovoid.Animation.prototype = new Ovoid.Constraint;
Ovoid.Animation.prototype.constructor = Ovoid.Animation;


/**
 * Create curve on animation channel.<br><br>
 * 
 * Creates an linear/cosin interpolation curve to the specified animation 
 * channel according to the specified data arrays.<br><br>
 *
 * @param {bitmask} f Curve target channel. Can be one the following symbolic 
 * constant:<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_R (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_G (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_B (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_A (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_VISIBILITY (not yet implemented)<br>
 * @param {float[]} x Curve keyframe times Array.
 * @param {float[]} y Curve keyframe values Array.
 */
Ovoid.Animation.prototype.setCspline = function(f, x, y) {

  this._format |= f;
  for (var i = 0, b = 0x1, P = 0; i < 21; i++, b <<= 1) {
    if (f & b) {
      this._channel[i] = new Ovoid.Cspline(x, y);
    }
  }
};


/**
 * Create curve on animation channel.<br><br>
 * 
 * Creates an Hermit interpolation curve to the specified animation 
 * channel according to the specified data arrays.<br><br>
 *
 * @param {bitmask} f Curve target channel. Can be one the following symbolic 
 * constant:<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_R (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_G (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_B (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_A (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_VISIBILITY (not yet implemented)<br>
 * @param {float[]} x Curve keyframe time array.
 * @param {float[]} y Curve keyframe value array.
 * @param {float[]} v Curve Tangent vector array.
 */
Ovoid.Animation.prototype.setHspline = function(f, x, y, v) {

  this._format |= f;
  for (var i = 0, b = 0x1, P = 0; i < 21; i++, b <<= 1) {
    if (f & b) {
      this._channel[i] = new Ovoid.Hspline(x, y, v);
    }
  }
};


/**
 * Create curve on animation channel.<br><br>
 * 
 * Creates an Bezier interpolation curve to the specified animation 
 * channel according to the specified data arrays.<br><br>
 *
 * @param {bitmask} f Curve target channel. Can be one the following symbolic 
 * constant:<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_TRANSLATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ROTATE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_ORIENTE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_X,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Y,<br>
 * Ovoid.ANIMATION_CHANNEL_SCALE_Z,<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_R (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_G (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_B (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_COLOR_A (not yet implemented),<br>
 * Ovoid.ANIMATION_CHANNEL_VISIBILITY (not yet implemented)<br>
 * @param {float[]} x Curve keyframe time array.
 * @param {float[]} y Curve keyframe value array.
 * @param {float[]} cx Curve control-point time array.
 * @param {float[]} cy Curve control-point value array.
 */
Ovoid.Animation.prototype.setBspline = function(f, x, y, cx, cy) {

  this._format |= f;
  for (var i = 0, b = 0x1, P = 0; i < 21; i++, b <<= 1) {
    if (f & b) {
      this._channel[i] = new Ovoid.Bspline(x, y, cx, cy);
    }
  }
};


/**
 * Set animation loop.<br><br>
 * 
 * Enable or disable the animation looping.
 *
 * @param {bool} loop Boolean to enable or disable.
 */
Ovoid.Animation.prototype.setLoop = function(loop) {

  this.loop = loop;
};


/**
 * Stop animation.<br><br>
 * 
 * Stop or pause the animation at the current time.
 */
Ovoid.Animation.prototype.stop = function() {

  if (!this.playing) return;
  this.playing = false;
};


/**
 * Play animation.<br><br>
 * 
 * Play the animation from the current time with the specified pitch.
 *
 * @param {float} factor Pitch time factor.
 * The factor can be positive to increase the animation pitch or negative to 
 * play the animation backward. For example a value of -2.0 will play the 
 * animation backward twice the normal speed.
 */
Ovoid.Animation.prototype.play = function(factor) {

  if (factor)
    this.factor = factor;

  if (this.ended) {
    while (i--) {
      if (this._channel[i]) this._channel[i]._stop = false;
    }
  }

  this.playing = true;
};


/**
 * Rewind animation.<br><br>
 * 
 * Rewind the animation at the end or the begining according to the specified 
 * pitch.
 *
 * @param {float} factor Pitch time factor.
 * A positive value will set the animation at its begining, a negative value 
 * will set the animation at its end.
 */
Ovoid.Animation.prototype.rewind = function(factor) {

  var i = 32;

  if (factor)
    this.factor = factor;

  if (this.factor > 0.0) {
    while (i--) {
      if (this._channel[i]) { 
        this._channel[i].seekStart(this.smooth, 0);
        this._channel[i]._stop = false;
        this._output[i] = this._channel[i].getOutput(this.smooth);
      }
    }
  } else {
    while (i--) {
      if (this._channel[i]) { 
        this._channel[i].seekEnd(this.smooth, 0);
        this._channel[i]._stop = false;
        this._output[i] = this._channel[i].getOutput(this.smooth);
      }
    }
  }

  if(this.target[0]) {
    if (this._format & Ovoid.ANIMATION_CHANNEL_TRANSLATE)
    {
      this.target[0].translation.setv(this._output.subarray(0, 3));
      this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
    }

    if (this._format & Ovoid.ANIMATION_CHANNEL_ROTATE)
    {
      this.target[0].rotation.fromEulerXyz(this._output[3],
                                        this._output[4],
                                        this._output[5]);

      this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
    }

    if (this._format & Ovoid.ANIMATION_CHANNEL_ORIENTE) {

      this.body.orientation.fromEulerXyz(this._output[6],
          this._output[7],
          this._output[8]);

      this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
    }

    if (this._format & Ovoid.ANIMATION_CHANNEL_SCALE) {
      this.target[0].scaling.setv(this._output.subarray(9, 12));
      this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
    }
  }
  this._time = 0.0;
  this.ended = false;
};

/**
 * Get Animation time.<br><br>
 * 
 * Returns the current Animation playing time since begining.
 *
 * @return Current Track playing time.
 */
Ovoid.Animation.prototype.time = function() {

  return this._time;
};

/**
 * Node's caching function.<br><br>
 *
 * Ovoid implements a node's caching system to prevent useless data computing, 
 * and so optimize global performances. This function is used internally by the
 * <c>Ovoid.Queuer</c> global class and should not be called independently.
 * 
 * @private
 */
Ovoid.Animation.prototype.cachAnimation = function() {

  if (this.playing)
  {
    this.playing = false;

    /* Avance/recule les curves et update les output */
    var qt = this._i.Timer.quantum * this.factor;
    var i = 32;
    if (this.factor > 0.0) {
      while (i--) {
        if (this._channel[i]) {
          if (!this._channel[i]._stop) {
            this._channel[i].seekForward(this.smooth, qt);
            this._output[i] = this._channel[i].getOutput(this.smooth);
            this.playing = true;
          }
        }
      }
    } else {
      while (i--) {
        if (this._channel[i]) {
          if (!this._channel[i]._stop) {
            this._channel[i].seekBackward(this.smooth, qt);
            this._output[i] = this._channel[i].getOutput(this.smooth);
            this.playing = true;
          }
        }
      }
    }

    /* Incremente le temps */
    this._time += (this._i.Timer.quantum * this.factor);
    
    /* Controle d'animation play/end/loop */
    if (!this.playing) {
      try { /* handle exceptions car des fonctions sont custom */
        this.onended(this);
      } catch(e) {
        Ovoid._log(0, this._i, '::Animation.cachAnimation', this.name + 
              ':: Custom onended() function exception thrown:\n' + e.stack);
      }
      if (this.loop) {
        /* Rewind curves */
        if (this.factor > 0.0) {
          while (i--) {
            if (this._channel[i]) { 
              this._channel[i].seekStart(this.smooth, 0);
              this._channel[i]._stop = false;
              this._output[i] = this._channel[i].getOutput(this.smooth);
            }
          }
        } else {
          while (i--) {
            if (this._channel[i]) { 
              this._channel[i].seekEnd(this.smooth, 0);
              this._channel[i]._stop = false;
              this._output[i] = this._channel[i].getOutput(this.smooth);
            }
          }
        }
        this._time = 0.0;
        this.ended = false;
        this.playing = true;
      } else {
        this.ended = true;
        return;
      }
    }

    /* Application des valeurs output à la node Transform */
    if(this.target[0]) {
      if (this._format & Ovoid.ANIMATION_CHANNEL_TRANSLATE)
      {
        this.target[0].translation.setv(this._output.subarray(0, 3));
        this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
      }

      if (this._format & Ovoid.ANIMATION_CHANNEL_ROTATE)
      {
        this.target[0].rotation.fromEulerXyz(this._output[3],
                                          this._output[4],
                                          this._output[5]);

        this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
      }

      if (this._format & Ovoid.ANIMATION_CHANNEL_ORIENTE) {

        this.body.orientation.fromEulerXyz(this._output[6],
            this._output[7],
            this._output[8]);

        this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
      }

      if (this._format & Ovoid.ANIMATION_CHANNEL_SCALE) {
        this.target[0].scaling.setv(this._output.subarray(9, 12));
        this.target[0].unCach(Ovoid.CACH_WORLD | Ovoid.CACH_TRANSFORM);
      }
    }
  }
};


/**
 * JavaScript Object Notation (JSON) serialization method.
 * 
 * <br><br>This method is commonly used by the <c>Ovoid.Ojson</c> class
 * to stringify and export scene.
 *  
 * @return {Object} The JSON object version of this node.
 * 
 * @private
 */
Ovoid.Animation.prototype.toJSON = function() {
  
  var o = new Object();
  /* node type */
  o['t'] = Ovoid.ANIMATION;
  /* Ovoid.Node */
  o['n'] = this.name;
  o['v'] = this.visible;
  o['u'] = this.uid;
  o['p'] = this.parent?this.parent.uid:'null';
  o['c'] = new Array();
  for(var i = 0; i < this.child.length; i++)
    o['c'][i] = this.child[i].uid;
  o['dp'] = new Array();
  for(var i = 0; i < this.depend.length; i++)
    o['dp'][i] = this.depend[i].uid;
  o['lk'] = new Array();
  for(var i = 0; i < this.link.length; i++)
    o['lk'][i] = this.link[i].uid;
  o['bmn'] = this.boundingBox.min;
  o['bmx'] = this.boundingBox.max;
  o['brd'] = this.boundingSphere.radius;
  /* Ovoid.Constraint */
  o['ct'] = new Array();
  for(var i = 0; i < this.target.length; i++)
    o['ct'][i] = this.target[i].uid;
  /* Ovoid.Animation */
  o['ft'] = this._format;
  o['pl'] = this.playing;
  o['lo'] = this.loop;
  o['en'] = this.ended;
  o['sm'] = this.smooth;
  o['fc'] = this.factor;

  o['cn'] = new Array(21);
  for (var i = 0; i < 21; i++) {
    if(this._channel[i]) {
      o['cn'][i] = this._channel[i];
    } else {
      o['cn'][i] = 'null';
    }
  }
  o['oe'] = Ovoid.compact(this.onended);
  return o;
};
