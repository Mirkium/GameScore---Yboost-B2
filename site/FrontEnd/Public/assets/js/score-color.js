const scoreElements = document.querySelectorAll(".NoteCommu, .recentGameNote, .gameScore, .smallScore");

function interpolateColor(value) {
    value = Math.max(0, Math.min(100, value));

    let r;
    let g;
    let b;

    if (value >= 50) {
        const t = (value - 50) / 50;
        const r1 = 255;
        const g1 = 153;
        const b1 = 0;
        const r2 = 0;
        const g2 = 229;
        const b2 = 255;

        r = Math.round(r1 + (r2 - r1) * t);
        g = Math.round(g1 + (g2 - g1) * t);
        b = Math.round(b1 + (b2 - b1) * t);
    } else {
        const t = value / 50;
        const r1 = 255;
        const g1 = 26;
        const b1 = 26;
        const r2 = 255;
        const g2 = 153;
        const b2 = 0;

        r = Math.round(r1 + (r2 - r1) * t);
        g = Math.round(g1 + (g2 - g1) * t);
        b = Math.round(b1 + (b2 - b1) * t);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

scoreElements.forEach((element) => {
    const value = parseInt(element.textContent, 10);

    if (Number.isNaN(value)) {
        return;
    }

    const color = interpolateColor(value);
    element.style.color = color;
    element.style.borderColor = color;
    element.style.textShadow = `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`;
});
