const input = document.getElementById("search");
const filters = document.getElementById("filters");
const state = document.getElementById("status");
const gallery = document.getElementById("gallery");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const mobileMenu = document.getElementById("mobile-menu");
const closeMenuBtn = document.querySelector(".close-menu-btn");
const scrollBtn = document.getElementById("scroll-btn");
const scrollToTop = document.getElementById("scroll-to-top");
const modalCard = document.getElementById("modal-card");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.querySelector(".close-modal-btn");
const moreInfoBtn = document.getElementById("more-info-btn");
//state
let allArtWorks = [];
let currentCategory = "";
//config
const API_URL = "https://api.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_title,artwork_type_title&limit=40";
const API_URL_DETAIL = (id) => `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,image_id,thumbnail,artwork_type_title,artist_display,description,short_description,dimensions,medium_display,style_title`;
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='843' height='562' viewBox='0 0 843 562'%3E%3Crect width='843' height='562' fill='%23e8e8e8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23999'%3ENo image%3C/text%3E%3C/svg%3E";
//data layer
class NetworkError extends Error {
}
async function getJSON(url) {
    let response;
    try {
        response = await fetch(url);
    }
    catch {
        throw new NetworkError("Network error. Please check your connection.");
    }
    if (!response.ok) {
        throw new Error(`API error (${response.status})`);
    }
    try {
        return await response.json();
    }
    catch {
        throw new Error("Invalid response format.");
    }
}
async function getArtWorks() {
    const data = await getJSON(API_URL);
    const artworks = data.data || [];
    const seenImages = new Set();
    return artworks.filter((art) => {
        if (!art.image_id)
            return true;
        if (seenImages.has(art.image_id))
            return false;
        seenImages.add(art.image_id);
        return true;
    });
}
async function getArtWorkDetail(id) {
    const data = await getJSON(API_URL_DETAIL(id));
    return data.data;
}
//app layer
async function main() {
    renderLoading();
    try {
        const artworks = await getArtWorks();
        allArtWorks = artworks;
        if (allArtWorks.length === 0) {
            renderStatus("No artworks found :(", "not-found");
            return;
        }
        //derived data
        const categories = getCategories(allArtWorks);
        //initialize UI
        renderFilters(categories);
        renderArtWorks(allArtWorks);
        clearStatus();
    }
    catch (error) {
        if (error instanceof NetworkError) {
            renderStatus(error.message, "connection");
        }
        else if (error instanceof Error) {
            renderStatus(error.message, "error");
        }
        else {
            renderStatus("Something went wrong :/", "error");
        }
    }
}
//presentation layer
function renderLoading() {
    state.textContent = "Loading...";
    gallery.innerHTML = "";
}
function renderStatus(message, type = "error") {
    state.textContent = message;
    state.className = type;
}
function clearStatus() {
    state.textContent = "";
    state.className = "";
}
//card display
function renderArtWorks(artworks) {
    gallery.innerHTML = "";
    artworks.forEach((art) => {
        const card = document.createElement("div");
        card.classList.add("card");
        const category = document.createElement("p");
        category.innerHTML = art.artwork_type_title || "Unknown category";
        category.classList.add("category");
        const img = document.createElement("img");
        img.src = art.image_id
            ? `https://www.artic.edu/iiif/2/${art.image_id}/full/843,/0/default.jpg`
            : PLACEHOLDER;
        img.onerror = () => {
            img.onerror = null;
            img.src = PLACEHOLDER;
        };
        img.alt = art.title || "Untitled";
        img.classList.add("card-img");
        const title = document.createElement("h2");
        title.innerHTML = art.title || "Untitled";
        title.classList.add("work-title");
        const artist = document.createElement("p");
        artist.innerHTML = art.artist_title || "Unknown artist";
        artist.classList.add("artist-title");
        card.appendChild(category);
        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(artist);
        gallery.appendChild(card);
        card.addEventListener("click", () => {
            modalCard.innerHTML = "";
            (async () => {
                try {
                    const details = await getArtWorkDetail(art.id);
                    renderModal(details);
                }
                catch (error) {
                    if (error instanceof NetworkError) {
                        renderStatus(error.message, "connection");
                    }
                    else if (error instanceof Error) {
                        renderStatus(error.message, "error");
                    }
                    else {
                        renderStatus("Something went wrong :/", "error");
                    }
                }
            })();
        });
    });
}
function renderModal(details) {
    closeModalBtn.classList.remove("hidden");
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("modal-info");
    const title = document.createElement("h2");
    title.innerHTML = details.title || "Untitled";
    title.classList.add("work-title-modal");
    const category = document.createElement("h3");
    category.innerHTML = details.artwork_type_title || "Untitled";
    category.classList.add("category-modal");
    const medium = document.createElement("p");
    medium.innerHTML = `<span class= "detail-label">Medium: </span> ${details.medium_display || "Unknown medium"}`;
    medium.classList.add("medium");
    const dimensions = document.createElement("p");
    dimensions.innerHTML = `<span class= "detail-label">Dimensions: </span> ${details.dimensions || "Unknown dimensions"}`;
    dimensions.classList.add("dimensions");
    const img = document.createElement("img");
    img.src = details.image_id
        ? `https://www.artic.edu/iiif/2/${details.image_id}/full/843,/0/default.jpg`
        : PLACEHOLDER;
    img.onerror = () => {
        img.onerror = null;
        img.src = PLACEHOLDER;
    };
    img.alt = details.thumbnail?.alt_text || "Artwork from the Chicago Museum";
    img.classList.add("modal-img");
    const artist = document.createElement("p");
    artist.innerHTML = `<span class= "detail-label">Artist: </span> ${details.artist_display || "Unknown artist"}`;
    artist.classList.add("artist");
    const style = document.createElement("p");
    style.innerHTML = `<span class="detail-label">Style: </span> ${details.style_title || "No style found"}`;
    style.classList.add("style");
    const shortDescription = document.createElement("p");
    shortDescription.innerHTML = `<span class="detail-label">
    Description: </span> ${details.short_description || "No description found"}`;
    shortDescription.classList.add("shortDesc");
    const longDescription = document.createElement("p");
    longDescription.innerHTML = `<span class ="detail-label">Extended description: </span>${details.description || "No description details found"}`;
    longDescription.classList.add("longDesc");
    infoContainer.appendChild(img);
    infoContainer.appendChild(title);
    infoContainer.appendChild(category);
    infoContainer.appendChild(medium);
    infoContainer.appendChild(dimensions);
    infoContainer.appendChild(artist);
    infoContainer.appendChild(style);
    infoContainer.appendChild(shortDescription);
    infoContainer.appendChild(moreInfoBtn);
    infoContainer.appendChild(longDescription);
    modalCard.appendChild(img);
    modalCard.appendChild(infoContainer);
    modalCard.classList.remove("hidden");
    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    let isOpen = false;
    moreInfoBtn.onclick = () => {
        isOpen = !isOpen;
        moreInfoBtn.textContent = isOpen ? "More info -" : "More info +";
        longDescription.classList.toggle("show");
    };
}
//data transformation: categories
function getCategories(artworks) {
    return [
        ...new Set(artworks
            .map((art) => art.artwork_type_title)
            .filter((cat) => Boolean(cat))),
    ];
}
function renderFilters(categories) {
    filters.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.innerHTML = "All";
    allBtn.classList.add("btn-cat");
    allBtn.addEventListener("click", () => {
        clearActiveButtons();
        allBtn.classList.add("active");
        currentCategory = "";
        applyFilters();
        closeMobileMenu();
    });
    filters.appendChild(allBtn);
    categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.innerHTML = cat;
        btn.classList.add("btn-cat");
        btn.addEventListener("click", () => {
            clearActiveButtons();
            btn.classList.add("active");
            currentCategory = cat;
            applyFilters();
            closeMobileMenu();
        });
        filters.appendChild(btn);
    });
}
function applyFilters() {
    clearStatus();
    let filtered = allArtWorks;
    if (currentCategory) {
        filtered = filtered.filter((artwork) => {
            return artwork.artwork_type_title === currentCategory;
        });
    }
    const value = input.value.toLowerCase().trim();
    if (value) {
        filtered = filtered.filter((art) => art.title?.toLowerCase().includes(value) ||
            art.artist_title?.toLowerCase().includes(value));
    }
    if (filtered.length === 0) {
        renderStatus("No works found", "not-found");
    }
    renderArtWorks(filtered);
}
//UI behaviour
let timeout;
input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(applyFilters, 300);
});
function toggleMobileMenu() {
    const isOpening = !mobileMenu.classList.contains("open");
    mobileMenu.classList.toggle("open");
    hamburgerBtn.classList.toggle("active");
    document.body.style.overflow = isOpening ? "hidden" : "";
}
hamburgerBtn.addEventListener("click", toggleMobileMenu);
function clearActiveButtons() {
    document
        .querySelectorAll(".btn-cat")
        .forEach((button) => button.classList.remove("active"));
}
function closeMobileMenu() {
    mobileMenu.classList.remove("open");
    hamburgerBtn.classList.remove("active");
    document.body.style.overflow = "";
}
closeMenuBtn.addEventListener("click", () => {
    closeMobileMenu();
});
scrollBtn.addEventListener("click", () => {
    toggleMobileMenu();
});
window.addEventListener("scroll", () => {
    if (window.scrollY > 1000) {
        scrollToTop.classList.remove("hidden");
    }
    else {
        scrollToTop.classList.add("hidden");
    }
    if (window.scrollY > 100) {
        scrollBtn.classList.add("show");
    }
    else {
        scrollBtn.classList.remove("show");
    }
});
//modal-card
function closeModal() {
    modalOverlay.classList.add("hidden");
    modalCard.classList.add("hidden");
    closeModalBtn.classList.add("hidden");
    document.body.style.overflow = "";
    moreInfoBtn.textContent = "More info +";
}
closeModalBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
main();
export {};
//# sourceMappingURL=script.js.map