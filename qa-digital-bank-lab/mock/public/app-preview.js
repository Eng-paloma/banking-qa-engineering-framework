const hero = document.querySelector('.login-hero');
const device = document.querySelector('.hero-app-visual');

if (hero && device) {
  hero.addEventListener('mousemove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -10;

    device.style.transform = `translateY(-6px) rotateX(${y}deg) rotateY(${x}deg)`;
  });

  hero.addEventListener('mouseleave', () => {
    device.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
  });
}
