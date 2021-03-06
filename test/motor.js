var MockFirmata = require("./util/mock-firmata"),
  five = require("../lib/johnny-five.js"),
  sinon = require("sinon"),
  Board = five.Board,
  Motor = five.Motor,
  Sensor = five.Sensor;

function newBoard() {
  return new Board({
    io: new MockFirmata(),
    debug: false,
    repl: false
  });
}

exports["Motor: Non-Directional"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.spy = sinon.spy(this.board.io, "analogWrite");
    this.motor = new Motor({
      board: this.board,
      pin: 11
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "speed"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.pins.pwm, 11);
    test.equal(this.motor.opts.device, "NONDIRECTIONAL");
    test.equal(typeof this.motor.pins.dir, "undefined");

    test.done();
  },

  startStop: function(test) {
    test.expect(3);

    this.motor.start();
    test.deepEqual(this.spy.args[0], [11, 128]);
    this.spy.reset();

    this.motor.stop();
    test.deepEqual(this.spy.args[0], [11, 0]);
    this.spy.reset();

    this.motor.start();
    test.deepEqual(this.spy.args[0], [11, 128]);
    test.done();
  },

  startBrakeRelease: function(test) {
    test.expect(3);

    this.motor.start();
    test.deepEqual(this.spy.args[0], [11, 128]);
    this.spy.reset();

    this.motor.brake();
    test.deepEqual(this.spy.args[0], [11, 0]);
    this.spy.reset();

    this.motor.release();
    test.deepEqual(this.spy.args[0], [11, 128]);
    test.done();
  },

  threshold: function(test) {
    test.expect(2);

    this.motor.threshold = 30;
    this.spy.reset();
    this.motor.start(20);
    test.deepEqual(this.spy.args[0], [11, 0]);

    this.spy.reset();
    this.motor.start(40);
    test.deepEqual(this.spy.args[0], [11, 40]);

    test.done();
  }

};

exports["Motor: Directional"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: [11, 12]
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(2);

    test.equal(this.motor.pins.pwm, 11);
    test.equal(this.motor.pins.dir, 12);

    test.done();
  },

  startStop: function(test) {
    test.expect(3);

    this.analogSpy.reset();
    this.motor.start();
    test.deepEqual(this.analogSpy.args[0], [11, 128]);

    this.analogSpy.reset();
    this.motor.stop();
    test.deepEqual(this.analogSpy.args[0], [11, 0]);

    this.analogSpy.reset();
    this.motor.start();
    test.deepEqual(this.analogSpy.args[0], [11, 128]);

    test.done();
  },

  forward: function(test) {
    test.expect(2);

    this.motor.forward(128);
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));

    test.done();
  },

  reverse: function(test) {
    test.expect(2);

    this.motor.reverse(128);
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));

    test.done();
  },

  brake: function(test) {
    test.expect(6);

    this.motor.rev(128);
    test.ok(this.analogSpy.firstCall.calledWith(11, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.forward(180);
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 180));

    test.done();
  },

  threshold: function(test) {
    test.expect(3);

    this.motor.threshold = 30;
    this.motor.start(20);
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    test.done();
  }
};

exports["Motor: Directional with no speed passed"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: [11, 12]
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {

    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  start: function(test) {
    test.expect(6);

    this.motor.forward();
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.forward(200);
    test.ok(this.analogSpy.lastCall.calledWith(11, 200));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.start();
    test.ok(this.analogSpy.lastCall.calledWith(11, 200));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));

    test.done();
  },

  threshold: function(test) {
    test.expect(3);

    this.motor.threshold = 30;
    this.motor.start(20);
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));

    test.done();
  }
};

exports["Motor: Directional with Brake"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: {
        pwm: 3,
        dir: 12,
        brake: 9
      }
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "brake"
    }, {
      name: "release"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.pins.pwm, 3);
    test.equal(this.motor.pins.dir, 12);
    test.equal(this.motor.pins.brake, 9);

    test.done();
  },

  startStop: function(test) {
    test.expect(2);

    this.motor.start();
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(3, 0));

    test.done();
  },

  forward: function(test) {
    test.expect(2);

    this.motor.forward(128);
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));

    test.done();
  },

  reverse: function(test) {
    test.expect(2);

    this.motor.reverse(128);
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));

    test.done();
  },

  brake: function(test) {
    test.expect(14);

    this.motor.rev(128);
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(3, 255));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.forward(180);
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(3, 255));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(3, 180));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    test.done();
  },

  timedBrake: function(test) {
    var clock = sinon.useFakeTimers();
    test.expect(5);

    this.motor.rev(128);
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake(1000);

    test.ok(this.analogSpy.lastCall.calledWith(3, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    clock.tick(1000);

    test.ok(this.analogSpy.firstCall.calledWith(3, 0));
    test.ok(this.analogSpy.lastCall.calledWith(3, 128));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));

    clock.restore();
    test.done();
  },

  threshold: function(test) {
    test.expect(7);

    this.motor.threshold = 30;
    this.motor.start(20);
    test.ok(this.analogSpy.calledWith(3, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(3, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(3, 0));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    test.done();
  }

};

exports["Motor: Directional with Current Sensing Pin"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: {
        pwm: 3,
        dir: 12
      },
      current: {
        pin: "A0",
        freq: 250
      }
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "brake"
    }, {
      name: "release"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }, {
      name: "current"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  current: function(test) {
    test.expect(1);

    test.ok(this.motor.current instanceof Sensor);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.pins.pwm, 3);
    test.equal(this.motor.pins.dir, 12);
    test.equal(this.motor.current.pin, "0");

    test.done();
  }

};

exports["Motor: Directional - Three Pin"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: [11, 12, 13]
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.pins.pwm, 11);
    test.equal(this.motor.pins.dir, 12);
    test.equal(this.motor.pins.cdir, 13);

    test.done();
  },

  start: function(test) {
    test.expect(3);

    this.motor.start();
    test.ok(this.digitalSpy.firstCall.calledWith(13, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));

    test.done();
  },

  stop: function(test) {
    test.expect(1);

    this.motor.stop();
    test.ok(this.analogSpy.calledWith(11, 0));

    test.done();
  },

  forward: function(test) {
    test.expect(3);

    this.analogSpy.reset();
    this.digitalSpy.reset();
    this.motor.forward(128);
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    test.ok(this.digitalSpy.firstCall.calledWith(13, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));

    test.done();
  },

  reverse: function(test) {
    test.expect(3);

    this.analogSpy.reset();
    this.digitalSpy.reset();
    this.motor.reverse(128);
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    test.ok(this.digitalSpy.firstCall.calledWith(13, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));

    test.done();
  },

  brakeRelease: function(test) {
    test.expect(6);

    this.motor.rev(128);
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(13, 1));

    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 128));
    test.ok(this.digitalSpy.firstCall.calledWith(13, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));

    test.done();
  },

};

exports["Motor: Inverse Speed When Forward"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: [11, 12],
      invertPWM: true
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }, {
      name: "invertPWM"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.opts.invertPWM, true);

    test.equal(this.motor.pins.pwm, 11);
    test.equal(this.motor.pins.dir, 12);

    test.done();
  },

  forward: function(test) {
    test.expect(6);

    this.motor.forward(255);
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.forward(180);
    test.ok(this.analogSpy.lastCall.calledWith(11, 75));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.start();
    test.ok(this.analogSpy.lastCall.calledWith(11, 75));

    test.done();
  },

  reverse: function(test) {
    test.expect(6);

    this.motor.reverse(255);
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.reverse(180);
    test.ok(this.analogSpy.lastCall.calledWith(11, 180));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.stop();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.start();
    test.ok(this.analogSpy.lastCall.calledWith(11, 180));

    test.done();
  },

  brake: function(test) {
    test.expect(8);

    this.motor.forward(255);
    // pwm values are inversed when the enable pin is high
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.reverse(255);
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));

    test.done();
  },

  threshold: function(test) {
    test.expect(4);

    this.motor.threshold = 30;
    this.motor.start(20);
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));

    test.done();
  }

};

exports["Motor: Inverse Speed With Brake"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.motor = new Motor({
      board: this.board,
      pins: {
        pwm: 11,
        dir: 12,
        brake: 9
      },
      invertPWM: true
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }, {
      name: "invertPWM"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  brake: function(test) {
    test.expect(17);

    this.motor.forward(255);
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.lastCall.calledWith(11, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.reverse(255);
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.brake();
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(9, 1));
    test.ok(this.digitalSpy.lastCall.calledWith(12, 1));
    this.analogSpy.reset();
    this.digitalSpy.reset();

    this.motor.release();
    test.ok(this.analogSpy.firstCall.calledWith(11, 0));
    test.ok(this.analogSpy.lastCall.calledWith(11, 255));
    test.ok(this.digitalSpy.firstCall.calledWith(12, 0));
    test.ok(this.digitalSpy.lastCall.calledWith(9, 0));

    test.done();
  }

};

exports["Motor: I2C - PCA9685"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.writeSpy = sinon.spy(this.board.io, "i2cWrite");
    this.motor = new Motor({
      board: this.board,
      pins: [8, 9, 10],
      controller: "PCA9685",
      address: 0x60
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(3);

    test.equal(this.motor.pins.pwm, 8);
    test.equal(this.motor.pins.dir, 9);
    test.equal(this.motor.pins.cdir, 10);

    test.done();
  },

  start: function(test) {
    test.expect(6);
    this.writeSpy.reset();

    this.motor.start();
    test.equal(this.writeSpy.args[0][0], 0x60);
    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 2048);
    test.equal(this.writeSpy.args[0][1][4], 8);

    test.done();
  },

  stop: function(test) {
    test.expect(6);
    this.writeSpy.reset();
    this.motor.stop();


    test.equal(this.writeSpy.args[0][0], 0x60);
    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 0);
    test.equal(this.writeSpy.args[0][1][4], 0);

    test.done();
  },

  forward: function(test) {
    test.expect(21);
    this.writeSpy.reset();

    this.motor.forward(128);

    test.equal(this.writeSpy.args[0][0], 0x60);

    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 0);
    test.equal(this.writeSpy.args[0][1][4], 0);

    test.equal(this.writeSpy.args[1][1][0], 46);
    test.equal(this.writeSpy.args[1][1][1], 0);
    test.equal(this.writeSpy.args[1][1][2], 0);
    test.equal(this.writeSpy.args[1][1][3], 0);
    test.equal(this.writeSpy.args[1][1][4], 0);

    test.equal(this.writeSpy.args[2][1][0], 42);
    test.equal(this.writeSpy.args[2][1][1], 0);
    test.equal(this.writeSpy.args[2][1][2], 0);
    test.equal(this.writeSpy.args[2][1][3], 4080);
    test.equal(this.writeSpy.args[2][1][4], 15);

    test.equal(this.writeSpy.args[3][1][0], 38);
    test.equal(this.writeSpy.args[3][1][1], 0);
    test.equal(this.writeSpy.args[3][1][2], 0);
    test.equal(this.writeSpy.args[3][1][3], 2048);
    test.equal(this.writeSpy.args[3][1][4], 8);
    test.done();
  },

  reverse: function(test) {
    test.expect(21);
    this.writeSpy.reset();

    this.motor.reverse(128);

    test.equal(this.writeSpy.args[0][0], 0x60);

    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 0);
    test.equal(this.writeSpy.args[0][1][4], 0);

    test.equal(this.writeSpy.args[1][1][0], 46);
    test.equal(this.writeSpy.args[1][1][1], 0);
    test.equal(this.writeSpy.args[1][1][2], 0);
    test.equal(this.writeSpy.args[1][1][3], 4080);
    test.equal(this.writeSpy.args[1][1][4], 15);

    test.equal(this.writeSpy.args[2][1][0], 42);
    test.equal(this.writeSpy.args[2][1][1], 0);
    test.equal(this.writeSpy.args[2][1][2], 0);
    test.equal(this.writeSpy.args[2][1][3], 0);
    test.equal(this.writeSpy.args[2][1][4], 0);

    test.equal(this.writeSpy.args[3][1][0], 38);
    test.equal(this.writeSpy.args[3][1][1], 0);
    test.equal(this.writeSpy.args[3][1][2], 0);
    test.equal(this.writeSpy.args[3][1][3], 2048);
    test.equal(this.writeSpy.args[3][1][4], 8);

    test.done();
  },

  brakeRelease: function(test) {
    test.expect(42);
    this.writeSpy.reset();

    this.motor.rev(128);
    this.writeSpy.reset();

    this.motor.brake();
    test.equal(this.writeSpy.args[0][0], 0x60);

    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 0);
    test.equal(this.writeSpy.args[0][1][4], 0);

    test.equal(this.writeSpy.args[1][1][0], 42);
    test.equal(this.writeSpy.args[1][1][1], 0);
    test.equal(this.writeSpy.args[1][1][2], 0);
    test.equal(this.writeSpy.args[1][1][3], 2032);
    test.equal(this.writeSpy.args[1][1][4], 7);

    test.equal(this.writeSpy.args[2][1][0], 46);
    test.equal(this.writeSpy.args[2][1][1], 2032);
    test.equal(this.writeSpy.args[2][1][2], 7);
    test.equal(this.writeSpy.args[2][1][3], 4080);
    test.equal(this.writeSpy.args[2][1][4], 15);

    test.equal(this.writeSpy.args[3][1][0], 38);
    test.equal(this.writeSpy.args[3][1][1], 0);
    test.equal(this.writeSpy.args[3][1][2], 0);
    test.equal(this.writeSpy.args[3][1][3], 4080);
    test.equal(this.writeSpy.args[3][1][4], 15);

    this.writeSpy.reset();

    this.motor.release();

    test.equal(this.writeSpy.args[0][0], 0x60);

    test.equal(this.writeSpy.args[0][1][0], 38);
    test.equal(this.writeSpy.args[0][1][1], 0);
    test.equal(this.writeSpy.args[0][1][2], 0);
    test.equal(this.writeSpy.args[0][1][3], 0);
    test.equal(this.writeSpy.args[0][1][4], 0);

    test.equal(this.writeSpy.args[1][1][0], 46);
    test.equal(this.writeSpy.args[1][1][1], 0);
    test.equal(this.writeSpy.args[1][1][2], 0);
    test.equal(this.writeSpy.args[1][1][3], 4080);
    test.equal(this.writeSpy.args[1][1][4], 15);

    test.equal(this.writeSpy.args[2][1][0], 42);
    test.equal(this.writeSpy.args[2][1][1], 0);
    test.equal(this.writeSpy.args[2][1][2], 0);
    test.equal(this.writeSpy.args[2][1][3], 0);
    test.equal(this.writeSpy.args[2][1][4], 0);

    test.equal(this.writeSpy.args[3][1][0], 38);
    test.equal(this.writeSpy.args[3][1][1], 0);
    test.equal(this.writeSpy.args[3][1][2], 0);
    test.equal(this.writeSpy.args[3][1][3], 2048);
    test.equal(this.writeSpy.args[3][1][4], 8);

    this.writeSpy.reset();

    test.done();
  },

};

exports["Motor: ShiftRegister"] = {
  setUp: function(done) {
    this.board = newBoard();
    this.digitalSpy = sinon.spy(this.board.io, "digitalWrite");
    this.analogSpy = sinon.spy(this.board.io, "analogWrite");
    this.shiftOutSpy = sinon.spy(this.board, "shiftOut");
    this.motor = new Motor({
      board: this.board,
      pins: {pwm: 11},
      register: { data: 8, clock: 4, latch: 12 },
      bits: { a: 2, b: 3 }
    });

    this.proto = [{
      name: "dir"
    }, {
      name: "start"
    }, {
      name: "stop"
    }, {
      name: "forward"
    }, {
      name: "fwd"
    }, {
      name: "reverse"
    }, {
      name: "rev"
    }, {
      name: "resume"
    }, {
      name: "setPin"
    }, {
      name: "setPWM"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "threshold"
    }, {
      name: "speed"
    }];

    done();
  },

  shape: function(test) {
    test.expect(this.proto.length + this.instance.length);

    this.proto.forEach(function(method) {
      test.equal(typeof this.motor[method.name], "function");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.motor[property.name], "undefined");
    }, this);

    test.done();
  },

  pinList: function(test) {
    test.expect(1);

    test.equal(this.motor.pins.pwm, 11);

    test.done();
  },

  start: function(test) {
    test.expect(1);

    this.motor.start();

    test.ok(this.analogSpy.lastCall.calledWith(11, 128));

    test.done();
  },

  stop: function(test) {
    test.expect(1);

    this.motor.stop();

    test.ok(this.analogSpy.lastCall.calledWith(11, 0));

    test.done();
  },

  forward: function(test) {
    test.expect(4);

    this.motor.forward(128);

    test.ok(this.analogSpy.lastCall.calledWith(11, 128));

    test.ok(this.digitalSpy.firstCall.calledWith(12, 0)); // Latch 0
    test.ok(this.shiftOutSpy.lastCall.calledWith(8, 4, true, 0x04));
    test.ok(this.digitalSpy.getCall(25).calledWith(12, 1)); // Latch 1

    test.done();
  },

  reverse: function(test) {
    test.expect(4);

    this.motor.reverse(128);

    test.ok(this.analogSpy.lastCall.calledWith(11, 128));

    test.ok(this.digitalSpy.firstCall.calledWith(12, 0)); // Latch 0
    test.ok(this.shiftOutSpy.lastCall.calledWith(8, 4, true, 0x08));
    test.ok(this.digitalSpy.getCall(25).calledWith(12, 1)); // Latch 1

    test.done();
  },
};

exports["Motor.Array"] = {
  setUp: function(done) {
    var board = new Board({
      io: new MockFirmata(),
      debug: false,
      repl: false
    });

    this.a = new Motor({
      pins: {
        pwm: 3,
        dir: 2,
        brake: 4
      },
      board: board
    });

    this.b = new Motor({
      pins: {
        pwm: 6,
        dir: 5,
        brake: 7
      },
      board: board
    });

    this.c = new Motor({
      pins: {
        pwm: 11,
        dir: 10,
        brake: 12
      },
      board: board
    });

    this.spies = [
      "start", "stop"
    ];

    this.spies.forEach(function(method) {
      this[method] = sinon.spy(Motor.prototype, method);
    }.bind(this));

    done();
  },

  tearDown: function(done) {
    this.spies.forEach(function(value) {
      this[value].restore();
    }.bind(this));
    done();
  },

  initFromMotorNumbers: function(test) {
    test.expect(1);

    var motors = new Motor.Array([
      { pwm: 3, dir: 4 },
      { pwm: 5, dir: 6 },
      { pwm: 9, dir: 10 }
    ]);

    test.equal(motors.length, 3);
    test.done();
  },

  initFromMotors: function(test) {
    test.expect(1);

    var motors = new Motor.Array([
      this.a, this.b, this.c
    ]);

    test.equal(motors.length, 3);
    test.done();
  },

  callForwarding: function(test) {
    test.expect(3);

    var motors = new Motor.Array([
      { pwm: 3, dir: 4 },
      { pwm: 5, dir: 6 },
      { pwm: 9, dir: 10 }
    ]);

    motors.start(90);

    test.equal(this.start.callCount, motors.length);
    test.equal(this.start.getCall(0).args[0], 90);

    motors.stop();

    test.equal(this.stop.callCount, motors.length);

    test.done();
  },

  arrayOfArrays: function(test) {
    test.expect(9);

    var motors = new Motor.Array([this.a, this.b]);
    var arrayOfArrays = new Motor.Array([motors, this.c]);

    arrayOfArrays.start(90);

    test.equal(this.start.callCount, 3);
    test.equal(this.start.getCall(0).args[0], 90);
    test.equal(this.start.getCall(1).args[0], 90);
    test.equal(this.start.getCall(2).args[0], 90);

    test.equal(arrayOfArrays.length, 2);
    test.equal(arrayOfArrays[0][0], this.a);
    test.equal(arrayOfArrays[0][1], this.b);
    test.equal(arrayOfArrays[1], this.c);

    arrayOfArrays.stop();

    test.equal(this.stop.callCount, 3);

    test.done();
  }

};
