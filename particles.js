(function () {
  'use strict';

  /* ─── CONFIG ───────────────────────────────────── */
  var PARTICLE_COUNT = 320;
  var PARTICLE_RADIUS = 2.2;
  var MORPH_INTERVAL = 3800;   // ms per shape
  var MORPH_SPEED    = 0.072;  // lerp factor toward target
  var DRIFT_SPEED    = 0.28;
  var REPEL_RADIUS   = 90;
  var REPEL_STRENGTH = 5.5;
  var COLOR_DARK     = '#1c1917';
  var COLOR_MID      = '#78716c';
  var COLOR_LIGHT    = '#c5bfb8';

  /* ─── SHAPES ────────────────────────────────────
     Each shape is a function that returns an array
     of {x, y} target positions in [0..1] normalised
     to canvas size. Points are sampled via an
     offscreen canvas.
  ─────────────────────────────────────────────── */

  function sampleOffscreen(drawFn, w, h, count) {
    var oc = document.createElement('canvas');
    oc.width  = w;
    oc.height = h;
    var ctx = oc.getContext('2d');
    drawFn(ctx, w, h);
    var img = ctx.getImageData(0, 0, w, h);
    var pts = [];
    for (var i = 0; i < img.data.length; i += 4) {
      if (img.data[i + 3] > 128) {
        var px = (i / 4) % w;
        var py = Math.floor((i / 4) / w);
        pts.push({ x: px / w, y: py / h });
      }
    }
    // subsample to exactly `count`
    var result = [];
    if (pts.length === 0) return result;
    var step = pts.length / count;
    for (var j = 0; j < count; j++) {
      result.push(pts[Math.min(Math.floor(j * step), pts.length - 1)]);
    }
    return result;
  }

  function shapeText(text, w, h) {
    return sampleOffscreen(function (ctx) {
      ctx.fillStyle = '#000';
      var size = Math.floor(h * 0.62);
      ctx.font = 'bold ' + size + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    }, w, h, PARTICLE_COUNT);
  }

  function shapeEmoji(emoji, w, h) {
    return sampleOffscreen(function (ctx) {
      var size = Math.floor(h * 0.72);
      ctx.font = size + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, w / 2, h / 2);
    }, w, h, PARTICLE_COUNT);
  }

  function shapeRandom(w, h) {
    var pts = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      pts.push({ x: Math.random(), y: Math.random() });
    }
    return pts;
  }

  /* ─── PARTICLE CLASS ────────────────────────── */
  function Particle(x, y) {
    this.x  = x;  this.y  = y;
    this.tx = x;  this.ty = y;   // target
    this.vx = (Math.random() - 0.5) * DRIFT_SPEED;
    this.vy = (Math.random() - 0.5) * DRIFT_SPEED;
    var r = Math.random();
    this.color = r < 0.4 ? COLOR_DARK : r < 0.75 ? COLOR_MID : COLOR_LIGHT;
    this.r = PARTICLE_RADIUS * (0.7 + Math.random() * 0.6);
    this.free = true;   // drifting freely vs morphing toward target
  }

  /* ─── MAIN ──────────────────────────────────── */
  function init() {
    var hero = document.getElementById('home');
    if (!hero) return;

    // Canvas behind hero content
    var canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:0'
    ].join(';');
    hero.style.position = 'relative';
    hero.insertBefore(canvas, hero.firstChild);

    // Hero inner above canvas
    var inner = hero.querySelector('.hero-inner');
    if (inner) inner.style.position = 'relative';

    var ctx = canvas.getContext('2d');
    var W, H, particles, shapes, shapeIdx, targets;
    var mouse = { x: -9999, y: -9999 };
    var morphing = false;

    function resize() {
      var rect = hero.getBoundingClientRect();
      W = canvas.width  = rect.width  || window.innerWidth;
      H = canvas.height = rect.height || window.innerHeight;
      buildShapes();
      if (particles) setTargets(shapes[shapeIdx]);
    }

    function buildShapes() {
      // Use a square sub-region so emoji render well
      var sz = Math.min(W, H);
      var sw = Math.floor(sz * 0.7), sh = Math.floor(sz * 0.28);
      shapes = [
        null,                                   // 0 = random
        shapeText('NICHOLE', sw * 2, sh * 2),   // 1
        shapeEmoji('📷', sh * 2, sh * 2),       // 2
        shapeEmoji('🌍', sh * 2, sh * 2),       // 3
        shapeEmoji('🧗', sh * 2, sh * 2),       // 4
        shapeEmoji('🏸', sh * 2, sh * 2)        // 5
      ];
    }

    function makeParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(
          Math.random() * W,
          Math.random() * H
        ));
      }
    }

    function setTargets(pts) {
      if (!pts) {
        // random drift
        morphing = false;
        particles.forEach(function (p) {
          p.free = true;
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
        });
        return;
      }
      morphing = true;

      // Centre the shape on canvas
      var offX = 0, offY = 0;
      if (shapeIdx === 1) {
        // text: centre horizontally, ~40% down
        offX = (W - Math.min(W * 0.7, W) * 0.5) * 0;
        offY = 0;
      }

      particles.forEach(function (p, i) {
        var pt = pts[i % pts.length];
        // map normalised coords to canvas centre region
        var regionW = W * 0.75;
        var regionH = H * 0.30;
        var startX  = (W - regionW) / 2;
        var startY  = H * 0.35;
        p.tx = startX + pt.x * regionW;
        p.ty = startY + pt.y * regionH;
        p.free = false;
      });
    }

    function startCycle() {
      shapeIdx = 0;
      setTargets(null);   // start random
      setTimeout(function cycle() {
        shapeIdx = (shapeIdx % (shapes.length - 1)) + 1;
        setTargets(shapes[shapeIdx]);
        // After holding shape for 2s, dissolve back to random briefly
        setTimeout(function () {
          if (shapeIdx === shapes.length - 1) {
            // last shape — go back to random then restart
            setTargets(null);
            setTimeout(function () {
              shapeIdx = 0;
              setTimeout(cycle, 1200);
            }, 1800);
          } else {
            setTimeout(cycle, 600);
          }
        }, MORPH_INTERVAL);
      }, 1800);  // initial random drift delay
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var mx = mouse.x, my = mouse.y;

      particles.forEach(function (p) {
        if (p.free) {
          // gentle autonomous drift
          p.vx += (Math.random() - 0.5) * 0.04;
          p.vy += (Math.random() - 0.5) * 0.04;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.x += p.vx;
          p.y += p.vy;
          // wrap
          if (p.x < 0)  p.x = W;
          if (p.x > W)  p.x = 0;
          if (p.y < 0)  p.y = H;
          if (p.y > H)  p.y = 0;
        } else {
          // lerp toward target
          p.x += (p.tx - p.x) * MORPH_SPEED;
          p.y += (p.ty - p.y) * MORPH_SPEED;
        }

        // mouse repulsion (always)
        var dx = p.x - mx, dy = p.y - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          var force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.x += (dx / dist) * force * REPEL_STRENGTH;
          p.y += (dy / dist) * force * REPEL_STRENGTH;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.free ? 0.45 : 0.82;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    // Mouse tracking relative to canvas
    hero.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    resize();
    makeParticles();
    startCycle();
    draw();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
