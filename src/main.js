
// Import the cocos2d module
var cocos = require('cocos2d'),
// Import the geometry module
    geo = require('geometry'),
// Import box2d Physics Engine
    box2d = require('box2d');


var b2Vec2          = box2d.Common.Math.b2Vec2,
    b2AABB          = box2d.Collision.b2AABB,
    b2BodyDef       = box2d.Dynamics.b2BodyDef,
    b2Body          = box2d.Dynamics.b2Body,
    b2FixtureDef    = box2d.Dynamics.b2FixtureDef,
    b2Fixture       = box2d.Dynamics.b2Fixture,
    b2World         = box2d.Dynamics.b2World,
    b2MassData      = box2d.Collision.Shapes.b2MassData,
    b2PolygonShape  = box2d.Collision.Shapes.b2PolygonShape,
    b2CircleShape   = box2d.Collision.Shapes.b2CircleShape,
    b2DebugDraw     = box2d.Dynamics.b2DebugDraw,
    b2MouseJointDef = box2d.Dynamics.Joints.b2MouseJointDef;



// Create a new layer
var PhysicsDemo = cocos.nodes.Layer.extend({
    world: null,
    bodies: null,
    selectedBody: null,
    mouseJoint: null,

    init: function() {
        // You must always call the super class version of init
        @super;

        this.set('isMouseEnabled', true);

        this.set('bodies', []);

        // Get size of canvas
        var s = cocos.Director.get('sharedDirector').get('winSize');

        this.demo();
        this.scheduleUpdate();
    },

    createCrate: function(point, scale) {
        scale = scale || 1;
        var sprite = cocos.nodes.Sprite.create({file: '/resources/crate.jpg'});
        sprite.set('position', point);
        sprite.set('scale', scale /2);
        this.addChild(sprite);
        return sprite;
    },

    createBall: function(point, scale) {
        scale = scale || 1;
        var sprite = cocos.nodes.Sprite.create({file: '/resources/ball.png'});
        sprite.set('position', point);
        sprite.set('scale', scale);
        this.addChild(sprite);
        return sprite;
    },

    update: function(dt) {
        var world = this.get('world'),
            mouseJoint = this.get('mouseJoint');

        world.Step(dt, 10, 10);
        //world.DrawDebugData();
        world.ClearForces();

        var bodies = this.get('bodies');
        for (var i = 0, len = bodies.length; i < len; i++) {
            var body = bodies[i],
                pos = body.GetPosition(),
                angle = geo.radiansToDegrees(body.GetAngle());
            body.sprite.set('position', new geo.Point(pos.x * 30, pos.y * 30));
            body.sprite.set('rotation', angle);
        }
    },

    demo: function() {
        var world = new b2World(
            new b2Vec2(0, 10),    //gravity
            true                  //allow sleep
        );
        this.set('world', world);

        var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;

        var bodyDef = new b2BodyDef;

        //create ground
        bodyDef.type = b2Body.b2_staticBody;
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(20, 2);
        bodyDef.position.Set(10, 400 / 30 + 2);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
        bodyDef.position.Set(10, -2);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
        fixDef.shape.SetAsBox(2, 14);
        bodyDef.position.Set(-2, 13);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
        bodyDef.position.Set(22, 13);
        world.CreateBody(bodyDef).CreateFixture(fixDef);


        //create some objects
        bodyDef.type = b2Body.b2_dynamicBody;
        for (var i = 0; i < 10; ++i) {
            var sprite;
            bodyDef.position.x = Math.random() * 10;
            bodyDef.position.y = Math.random() * 10;
            var scale = (Math.random() + 0.5),
                width = scale * 32;
            if (Math.random() > 0.5) {
                fixDef.shape = new b2PolygonShape;
                fixDef.shape.SetAsBox(width/30, width/30);
                sprite = this.createCrate(new geo.Point(bodyDef.position.x * 30, bodyDef.position.y * 30), scale);
            } else {
                fixDef.shape = new b2CircleShape(width/30);
                sprite = this.createBall(new geo.Point(bodyDef.position.x * 30, bodyDef.position.y * 30), scale);
            }

            var bdy = world.CreateBody(bodyDef);
            bdy.sprite = sprite;
            this.get('bodies').push(bdy);
            bdy.CreateFixture(fixDef);
        }



        //setup debug draw
        var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(document.getElementById('debug-canvas').getContext("2d"));
            debugDraw.SetDrawScale(30.0);
            debugDraw.SetFillAlpha(0.5);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            world.SetDebugDraw(debugDraw);
    }, 

    getBodyAtPoint: function (point) {
        point = new geo.Point(point.x /30, point.y /30);
        var world = this.get('world');
        var mousePVec = new b2Vec2(point.x, point.y);
        var aabb = new b2AABB();
        aabb.lowerBound.Set(point.x - 0.001, point.y - 0.001);
        aabb.upperBound.Set(point.x + 0.001, point.y + 0.001);


        var self = this;
        function getBodyCB(fixture) {
            if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
                if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
                    self.set('selectedBody', fixture.GetBody());
                    return false;
                }
            }
            return true;
        }


        // Query the world for overlapping shapes.

        this.set('selectedBody', null);
        world.QueryAABB(getBodyCB, aabb);
        return this.get('selectedBody');
    },

    mouseDown: function(evt) {
        var point = evt.locationInCanvas,
            world = this.get('world'),
            mouseJoint = this.get('mouseJoint');

        if (!mouseJoint) {
            var body = this.getBodyAtPoint(point);
            if(body) {
                var md = new b2MouseJointDef();
                md.bodyA = world.GetGroundBody();
                md.bodyB = body;
                md.target.Set(point.x /30, point.y /30);
                md.collideConnected = true;
                md.maxForce = 300.0 * body.GetMass();
                mouseJoint = world.CreateJoint(md);
                body.SetAwake(true);
                this.set('mouseJoint', mouseJoint);
            }
        }
    },

    mouseDragged: function(evt) {
        var point = evt.locationInCanvas,
            world = this.get('world'),
            mouseJoint = this.get('mouseJoint');

        if (mouseJoint) {
            mouseJoint.SetTarget(new b2Vec2(point.x /30, point.y /30));
        }
    },

    mouseUp: function(evt) {
        var mouseJoint = this.get('mouseJoint'),
            world = this.get('world');

        if (mouseJoint) {
            world.DestroyJoint(mouseJoint);
            this.set('mouseJoint', null);
        }
    }
});

// Initialise everything

// Get director
var director = cocos.Director.get('sharedDirector');

// Attach director to our <div> element
director.attachInView(document.getElementById('cocos2d-app'));

// Create a scene
var scene = cocos.nodes.Scene.create();

// Add our layer to the scene
scene.addChild({child: PhysicsDemo.create()});

// Run the scene
director.runWithScene(scene);
