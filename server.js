
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Parse JSON request bodies.
app.use(express.json());

// Serve frontend files from the public directory.
app.use(express.static(path.join(__dirname, "public")));

// Sample data stored in memory.
let products = [
    { id: 1, name: "Laptop", price: 850000 },
    { id: 2, name: "Keyboard", price: 25000 }
];

// Validate product information.
function validateProduct(name, price) {
    return (
        typeof name === "string" &&
        name.trim().length > 0 &&
        name.trim().length <= 100 &&
        price !== undefined &&
        price !== null &&
        price !== "" &&
        Number.isFinite(Number(price)) &&
        Number(price) >= 0
    );
}

// GET: Retrieve all products.
app.get("/api/products", (req, res) => {
    res.status(200).json(products);
});

// GET: Retrieve one product by ID.
app.get("/api/products/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
    }

    const product = products.find((item) => item.id === id);

    if (!product) {
        return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json(product);
});

// POST: Create a new product.
app.post("/api/products", (req, res) => {
    const { name, price } = req.body || {};

    if (!validateProduct(name, price)) {
        return res.status(400).json({
            error: "A valid product name and non-negative price are required."
        });
    }

    const newProduct = {
        id: products.length
            ? Math.max(...products.map((item) => item.id)) + 1
            : 1,
        name: name.trim(),
        price: Number(price)
    };

    products.push(newProduct);

    res.status(201).json(newProduct);
});

// PUT: Update an existing product.
app.put("/api/products/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
    }

    const product = products.find((item) => item.id === id);

    if (!product) {
        return res.status(404).json({ error: "Product not found." });
    }

    const { name, price } = req.body || {};

    if (!validateProduct(name, price)) {
        return res.status(400).json({
            error: "A valid product name and non-negative price are required."
        });
    }

    product.name = name.trim();
    product.price = Number(price);

    res.status(200).json(product);
});

// DELETE: Delete a product.
app.delete("/api/products/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
    }

    const index = products.findIndex((item) => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Product not found." });
    }

    const deletedProduct = products.splice(index, 1)[0];

    res.status(200).json({
        message: "Product deleted successfully.",
        product: deletedProduct
    });
});

// Handle unknown API routes.
app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found." });
});

// Handle invalid JSON and other errors.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON request body."
        });
    }

    console.error(err);

    res.status(500).json({
        error: "Internal server error."
    });
});

// Start the server.
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
