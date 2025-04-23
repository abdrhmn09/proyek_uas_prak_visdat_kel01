// JavaScript untuk interaktivitas
document.querySelectorAll('.topic-card').forEach((card, index) => {
    card.addEventListener('click', function(e) {
        // Mencegah navigasi jika yang diklik adalah ikon visualisasi
        if (!e.target.closest('.visualization-icon')) {
            window.location.href = `pages/topik0${index+1}.html`;
        }
    });
});