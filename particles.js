(function () {
  document.body.style.background = 'transparent';

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  var W, H, dots = [];
  var COUNT = 80;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function make() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.25, 0.25),
      r: rand(1, 2),
      a: rand(0.22, 0.6)
    };
  }

  resize();
  window.addEventListener('resize', function () {
    resize();
    dots = [];
    for (var i = 0; i < COUNT; i++) dots.push(make());
  });

  for (var i = 0; i < COUNT; i++) dots.push(make());

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < -2) d.x = W + 2;
      if (d.x > W + 2) d.x = -2;
      if (d.y < -2) d.y = H + 2;
      if (d.y > H + 2) d.y = -2;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(0,224,158,' + d.a + ')';
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
