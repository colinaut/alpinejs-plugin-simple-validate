document.addEventListener("alpine:init", () => {
	Alpine.data("nav", () => ({
		htmlPage: window.location.pathname.split("/").pop(),
		links: [
			{ name: "README Example", page: "index.html" },
			{ name: "Validation", page: "validation.html" },
			{ name: "Multiform", page: "multiform.html" },
			{ name: "Complicated Form", page: "complicated.html" },
			{ name: "Stepped Form", page: "steps.html" },
			{ name: "Login", page: "login.html" },
			{ name: "Partial", page: "partial.html" },
		],
	}));
});
