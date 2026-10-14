
const API_URL = "/api/products";

const productsContainer = document.getElementById("products-container");
const statusMessage = document.getElementById("status-message");
const refreshButton = document.getElementById("refresh-btn");
const productForm = document.getElementById("product-form");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const submitButton = document.getElementById("submit-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");
const formTitle = document.getElementById("form-title");

let editingProductId = null;

// Display a status message.
function showMessage(message, type = "success") {
    statusMessage.textContent = message;
    statusMessage.classList.remove("error-message", "success-message");

    if (message) {
        statusMessage.classList.add(
            type === "error" ? "error-message" : "success-message"
        );
    }
}

// Make an API request and handle JSON responses.
async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "The request failed.");
    }

    return result;
}

// Create a product card safely.
function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const id = document.createElement("p");
    id.className = "product-id";
    id.textContent = `Product ID: ${product.id}`;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent =
        `TZS ${Number(product.price).toLocaleString("en-TZ")}`;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
        startEditing(product);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        deleteProduct(product);
    });

    actions.append(editButton, deleteButton);
    card.append(name, id, price, actions);

    return card;
}

// GET: Load all products from the API.
async function loadProducts() {
    statusMessage.classList.remove("error-message", "success-message");
    showMessage("Loading products...");
    productsContainer.replaceChildren();
    refreshButton.disabled = true;

    try {
        const products = await apiRequest(API_URL);

        if (!Array.isArray(products)) {
            throw new Error("The API did not return a product list.");
        }

        if (products.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No products found. Add a product above.";
            productsContainer.appendChild(emptyMessage);

            showMessage("No products found.");
            return;
        }

        products.forEach((product) => {
            productsContainer.appendChild(createProductCard(product));
        });

        showMessage(`Showing ${products.length} product(s).`);

    } catch (error) {
        console.error("Failed to load products:", error);
        showMessage(error.message || "Could not load products.", "error");
    } finally {
        refreshButton.disabled = false;
    }
}

// Prepare the form to edit an existing product.
function startEditing(product) {
    editingProductId = product.id;

    productNameInput.value = product.name;
    productPriceInput.value = product.price;

    formTitle.textContent = `Edit Product #${product.id}`;
    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    showMessage(`Editing "${product.name}". Update the fields and save.`);

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    productNameInput.focus();
}

// Reset the form to create mode.
function resetForm() {
    editingProductId = null;
    productForm.reset();

    formTitle.textContent = "Add a New Product";
    submitButton.textContent = "Add Product";
    cancelEditButton.hidden = true;
}

// CREATE: POST a new product.
// UPDATE: PUT changes to an existing product.
productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = productNameInput.value.trim();
    const priceValue = productPriceInput.value;
    const price = Number(priceValue);

    if (
        !name ||
        name.length > 100 ||
        priceValue === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        showMessage(
            "Enter a product name and a valid non-negative price.",
            "error"
        );
        return;
    }

    const isEditing = editingProductId !== null;
    const url = isEditing
        ? `${API_URL}/${editingProductId}`
        : API_URL;

    const options = {
        method: isEditing ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, price })
    };

    submitButton.disabled = true;
    cancelEditButton.disabled = true;
    submitButton.textContent = isEditing ? "Saving..." : "Adding...";

    try {
        const result = await apiRequest(url, options);

        resetForm();
        await loadProducts();

        showMessage(
            isEditing
                ? `Product "${result.name}" updated successfully!`
                : `Product "${result.name}" added successfully!`
        );

    } catch (error) {
        console.error("Failed to save product:", error);
        showMessage(error.message || "Could not save product.", "error");
    } finally {
        submitButton.disabled = false;
        cancelEditButton.disabled = false;
        submitButton.textContent =
            editingProductId !== null ? "Save Changes" : "Add Product";
    }
});

// DELETE: Remove a product from the API.
async function deleteProduct(product) {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
        return;
    }

    showMessage(`Deleting "${product.name}"...`);

    try {
        await apiRequest(`${API_URL}/${product.id}`, {
            method: "DELETE"
        });

        if (editingProductId === product.id) {
            resetForm();
        }

        await loadProducts();
        showMessage(`Product "${product.name}" deleted successfully!`);

    } catch (error) {
        console.error("Failed to delete product:", error);
        showMessage(error.message || "Could not delete product.", "error");
    }
}

// Refresh the product list.
refreshButton.addEventListener("click", loadProducts);

// Cancel an edit.
cancelEditButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edit cancelled.");
});

// Load products when the page opens.
loadProducts();
