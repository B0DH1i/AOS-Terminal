const animation = () => {
  let canvas = document.getElementById('skyCanvas');
  if (!canvas) return;

  let ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  let stars = [];
  let starCount = 1000;
  let movingStarCount = 30;
  let trailLength = 10;
  let animationFrameId;
  let moveStarsTimeoutId;

  function Star(x, y) {
    this.x = x;
    this.y = y;
    this.originalSize = Math.random();
    this.size = this.originalSize;
    this.twinkle = Math.random() * 2 * Math.PI;
    this.speedX = 0;
    this.speedY = 0;
    this.moving = false;
    this.distanceMoved = 0;
  }

  Star.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    let alpha = (Math.sin(this.twinkle) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();

    if (this.moving) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.speedX * trailLength, this.y - this.speedY * trailLength);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
      ctx.stroke();
    }
  }

  Star.prototype.update = function () {
    if (this.moving) {
      this.distanceMoved += Math.abs(this.speedX) + Math.abs(this.speedY);
      if (this.distanceMoved < 50) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.size = Math.min(1.5 * this.originalSize, this.originalSize + 0.05 * this.distanceMoved);
      } else {
        this.moving = false;
        this.distanceMoved = 0;
        this.size = this.originalSize;
      }
    }
  }

  function init() {
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star(Math.random() * w, Math.random() * h));
    }
  }

  function moveRandomStars() {
    let movingStars = 0;
    while (movingStars < movingStarCount) {
      let randomStar = stars[Math.floor(Math.random() * starCount)];
      if (!randomStar.moving) {
        randomStar.speedX = (Math.random() - 0.5) / 2;
        randomStar.speedY = (Math.random() - 0.5) / 2;
        randomStar.moving = true;
        movingStars++;
      }
    }
    moveStarsTimeoutId = setTimeout(moveRandomStars, 2000);
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(star => {
      star.update();
      star.draw();
    });
    animationFrameId = requestAnimationFrame(animate);
  }

  init();
  moveRandomStars();
  animate();

  const handleResize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars.forEach(star => {
      star.x = Math.random() * w;
      star.y = Math.random() * h;
    });
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(animationFrameId);
    clearTimeout(moveStarsTimeoutId);
  };
}

export default animation;
