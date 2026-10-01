const contentField = document.getElementById("content");
const contentCounter = document.getElementById("content-counter");
const maxContentLength = Number(contentCounter.dataset.max);

contentField.addEventListener("input", () => {
	const length = [...contentField.value].length;
	contentCounter.textContent = `${length} / ${maxContentLength}`;
	contentCounter.classList.toggle(
		"text-tomato-deep",
		length > maxContentLength,
	);
});
