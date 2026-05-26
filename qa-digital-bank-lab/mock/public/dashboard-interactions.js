const interactiveCards = document.querySelectorAll('.card, .app-showcase, .balance-card');

interactiveCards.forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -6;
    card.style.transform = `translateY(-2px) rotateX(${y}deg) rotateY(${x}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
  });
});
