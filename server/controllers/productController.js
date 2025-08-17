const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Helper function to validate bundle components
const validateBundleComponents = async (bundleComponents, productIdToExclude = null) => {
    if (!Array.isArray(bundleComponents) || bundleComponents.length === 0) {
        throw new Error('Bundle components must be a non-empty array for a bundle product.');
    }

    const componentIds = new Set();
    for (const component of bundleComponents) {
        if (!component.product || !mongoose.Types.ObjectId.isValid(component.product)) {
            throw new Error('Each bundle component must have a valid product ID.');
        }
        if (component.quantity === undefined || typeof component.quantity !== 'number' || component.quantity < 1) {
            throw new Error('Each bundle component must have a quantity of 1 or more.');
        }

        const componentId = component.product.toString();
        if (componentId === productIdToExclude) {
            throw new Error('A bundle cannot contain itself as a component.');
        }
        if (componentIds.has(componentId)) {
            throw new Error('Duplicate components found in the bundle.');
        }
        componentIds.add(componentId);

        const componentProduct = await Product.findById(component.product);
        if (!componentProduct) {
            throw new Error(`Bundle component product with ID ${component.product} not found.`);
        }
        if (componentProduct.isBundle) {
            throw new Error(`Bundle component "${componentProduct.name}" cannot be another bundle. Nested bundles are not supported in this version.`);
        }
    }
    return true;
};

// Helper function to calculate bundle stock and price
const calculateBundleDetails = async (bundleComponents) => {
    let minStock = Infinity;
    let totalPrice = 0;

    if (!bundleComponents || bundleComponents.length === 0) {
        return { calculatedStock: 0, calculatedPrice: 0 };
    }

    for (const component of bundleComponents) {
        const componentProduct = await Product.findById(component.product);
        if (!componentProduct) {
            // This case should ideally be caught by validateBundleComponents,
            // but as a safeguard, treat as zero stock if component is missing.
            console.warn(`Component product ${component.product} not found for bundle calculation.`);
            minStock = 0; // If any component is missing, bundle stock is 0
            break;
        }

        // Calculate how many bundles can be made from this component's stock
        const possibleBundlesFromComponent = Math.floor(componentProduct.stock / component.quantity);
        minStock = Math.min(minStock, possibleBundlesFromComponent);

        // Add to total price
        totalPrice += componentProduct.price * component.quantity;
    }

    // Apply a hypothetical bundle discount (e.g., 10%)
    const finalPrice = totalPrice * 0.90; // Example: 10% discount

    return { calculatedStock: minStock === Infinity ? 0 : minStock, calculatedPrice: finalPrice };
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
    const { name, sku, category, stock, price, description, image, supplier, customFields, binLocation, lowStockThreshold, isBundle, bundleComponents } = req.body;

    if (!isBundle && (!name || !category || stock === undefined || price === undefined || !description || !supplier)) {
        return res.status(400).json({ message: 'Please enter all required fields: name, category, stock, price, description, supplier.' });
    }
    if (isBundle && (!name || !category || !description)) {
         return res.status(400).json({ message: 'For a bundle product, name, category, and description are required.' });
    }

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to create product: Only administrators can perform this action.' });
    }

    try {
        const existingProduct = await Product.findOne({ name: name.trim().toLowerCase() });
        if (existingProduct) {
            return res.status(400).json({ message: `Product with name "${name}" already exists.` });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'Invalid category ID provided.' });
        }
        const foundCategory = await Category.findById(category);
        if (!foundCategory) {
            return res.status(404).json({ message: 'Category not found with the provided ID.' });
        }

        let finalStock = stock;
        let finalPrice = price;
        let finalBundleComponents = bundleComponents || [];
        let finalSupplier = supplier;

        if (isBundle) {
            await validateBundleComponents(bundleComponents); // Validate first
            const { calculatedStock, calculatedPrice } = await calculateBundleDetails(bundleComponents);
            finalStock = calculatedStock;
            finalPrice = calculatedPrice;
            finalBundleComponents = bundleComponents.map(comp => ({
                product: new mongoose.Types.ObjectId(comp.product), // Ensure ObjectId
                quantity: comp.quantity
            }));
            finalSupplier = supplier || 'Derived from Components'; // Default supplier for bundles
        } else if (bundleComponents && bundleComponents.length > 0) {
            return res.status(400).json({ message: 'Bundle components can only be provided for bundle products.' });
        }

        const productData = {
            user: req.user.id,
            name: name.trim().toLowerCase(),
            sku: sku ? sku.trim().toUpperCase() : 'N/A',
            category: category,
            price: finalPrice, // Use calculated price for bundles, or provided for regular
            description: description.trim(),
            image: image || undefined,
            supplier: finalSupplier, // Use derived supplier for bundles, or provided for regular
            customFields: customFields || {},
            binLocation: binLocation || 'Main',
            lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : foundCategory.defaultLowStockThreshold || 50,
            isBundle: isBundle || false,
            bundleComponents: finalBundleComponents,
            stock: finalStock, // Use calculated stock for bundles, or provided for regular
        };

        const product = await Product.create(productData);

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('bundleComponents.product', 'name stock sku image price'); // Populate price for components

        res.status(201).json(populatedProduct);
    } catch (err) {
        console.error('❌ Create Product Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Product name "${name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while creating product: ' + err.message });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private (requires authentication)
const getProducts = async (req, res) => {
    try {
        let query = {};
        const products = await Product.find(query)
            .populate('category', 'name defaultLowStockThreshold')
            .populate('bundleComponents.product', 'name stock sku image price'); // Populate price for components

        res.status(200).json(products);
    } catch (err) {
        console.error('❌ Get Products Error:', err);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    try {
        const product = await Product.findById(id)
            .populate('category', 'name defaultLowStockThreshold')
            .populate('bundleComponents.product', 'name stock sku image price'); // Populate price for components

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(product);
    } catch (err) {
        console.error('❌ Get Product Error:', err);
        res.status(500).json({ message: 'Server error while fetching product.' });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, sku, category, stock, price, description, image, supplier, customFields, binLocation, lowStockThreshold, isBundle, bundleComponents } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update product: Only administrators can perform this action.' });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (name && name.trim().toLowerCase() !== product.name) {
            const existingProductWithName = await Product.findOne({ name: name.trim().toLowerCase() });
            if (existingProductWithName && existingProductWithName._id.toString() !== id) {
                return res.status(400).json({ message: `Product name "${name}" already exists.` });
            }
        }

        let finalStock = stock;
        let finalPrice = price;
        let finalBundleComponents = bundleComponents || [];
        let finalSupplier = supplier;

        if (isBundle) {
            if (bundleComponents === undefined) {
                return res.status(400).json({ message: 'Bundle components are required for a bundle product.' });
            }
            await validateBundleComponents(bundleComponents, id); // Validate first
            const { calculatedStock, calculatedPrice } = await calculateBundleDetails(bundleComponents);
            finalStock = calculatedStock;
            finalPrice = calculatedPrice;
            finalBundleComponents = bundleComponents.map(comp => ({
                product: new mongoose.Types.ObjectId(comp.product), // Ensure ObjectId
                quantity: comp.quantity
            }));
            finalSupplier = supplier || 'Derived from Components'; // Default supplier for bundles
        } else {
            finalBundleComponents = []; // Ensure empty if not a bundle
            // For non-bundle, stock and price are directly from input
            if (stock === undefined) return res.status(400).json({ message: 'Stock quantity is required for a non-bundle product.' });
            if (price === undefined) return res.status(400).json({ message: 'Price is required for a non-bundle product.' });
            if (supplier === undefined || !supplier.trim()) return res.status(400).json({ message: 'Supplier is required for a non-bundle product.' });
            finalStock = stock;
            finalPrice = price;
            finalSupplier = supplier.trim();
        }

        // Update fields
        if (name !== undefined) product.name = name.trim().toLowerCase();
        if (sku !== undefined) product.sku = sku.trim().toUpperCase();
        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: 'Invalid category ID provided for update.' });
            }
            const newCategory = await Category.findById(category);
            if (!newCategory) {
                return res.status(404).json({ message: 'Category not found with the provided ID for update.' });
            }
            // Update lowStockThreshold if category changes and no new threshold is provided
            if (lowStockThreshold === undefined && product.category.toString() !== newCategory._id.toString()) {
                product.lowStockThreshold = newCategory.defaultLowStockThreshold || 50;
            }
            product.category = category;
        }
        if (description !== undefined) product.description = description.trim();
        if (image !== undefined) product.image = image;
        if (customFields !== undefined) product.customFields = customFields;
        if (binLocation !== undefined) product.binLocation = binLocation.trim();
        if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;

        product.isBundle = isBundle;
        product.bundleComponents = finalBundleComponents;
        product.stock = finalStock;
        product.price = finalPrice;
        product.supplier = finalSupplier;


        const updated = await product.save();
        const populatedUpdatedProduct = await Product.findById(updated._id)
            .populate('category', 'name')
            .populate('bundleComponents.product', 'name stock sku image price'); // Populate price for components

        res.status(200).json(populatedUpdatedProduct);
    } catch (err) {
        console.error('❌ Update Product Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Product name "${req.body.name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while updating product.' });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete product: Only administrators can perform this action.' });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found for delete.' });
        }
        await product.deleteOne();
        res.status(200).json({ message: 'Product deleted successfully.' });
    }
    catch (err) {
        console.error('❌ Delete Product Error:', err);
        res.status(500).json({ message: 'Server error while deleting product.' });
    }
};

// @desc    Get total product count
// @route   GET /api/products/count
// @access  Public
const getProductCount = async (req, res) => {
    try {
        const count = await Product.countDocuments({});
        res.status(200).json({ count: count });
    } catch (error) {
        console.error('❌ Get Product Count Error:', error);
        res.status(500).json({ message: 'Server Error: Could not retrieve product count.' });
    }
};

// @desc    Get total stock quantity across all products
// @route   GET /api/products/total-stock
// @access  Public
const getTotalStock = async (req, res) => {
    try {
        const result = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: '$stock' }
                }
            }
        ]);
        const totalStock = result.length > 0 ? result[0].totalStock : 0;
        res.status(200).json({ totalStock: totalStock });
    } catch (error) {
        console.error('❌ Get Total Stock Error:', error);
        res.status(500).json({ message: 'Server Error: Could not retrieve total stock.' });
    }
};

// @desc    Get all products (for dashboard display, not user-specific)
// @route   GET /api/products/all
// @access  Public
const getAllProductsList = async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('category', 'name')
            .populate('bundleComponents.product', 'name stock sku image price') // Populate price for components
            .sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error('❌ Get All Products List Error:', error);
        res.status(500).json({ message: 'Server Error: Could not retrieve all products.' });
    }
};

// @desc    Deduct stock for bundle components when a bundle product is sold
// This function will be called by the order controller
const deductBundleComponentsStock = async (bundleProductId, quantitySold, session) => {
    if (!mongoose.Types.ObjectId.isValid(bundleProductId)) {
        throw new Error('Invalid bundle product ID for stock deduction.');
    }
    if (typeof quantitySold !== 'number' || quantitySold <= 0) {
        throw new Error('Quantity sold must be a positive number for stock deduction.');
    }

    if (!session) {
        throw new Error('Mongoose session is required for deductBundleComponentsStock.');
    }

    try {
        const bundleProduct = await Product.findById(bundleProductId).session(session);

        if (!bundleProduct) {
            throw new Error(`Bundle product with ID ${bundleProductId} not found.`);
        }
        if (!bundleProduct.isBundle) {
            throw new Error(`Product ${bundleProduct.name} (ID: ${bundleProductId}) is not a bundle. Stock deduction for components is not applicable.`);
        }
        if (bundleProduct.bundleComponents.length === 0) {
            throw new Error(`Bundle product ${bundleProduct.name} has no components defined.`);
        }

        for (const component of bundleProduct.bundleComponents) {
            const componentProduct = await Product.findById(component.product).session(session);
            if (!componentProduct) {
                throw new Error(`Component product ${component.product} not found for bundle ${bundleProduct.name}.`);
            }
            const requiredStock = component.quantity * quantitySold;
            if (componentProduct.stock < requiredStock) {
                throw new Error(`Insufficient stock for component "${componentProduct.name}". Required: ${requiredStock}, Available: ${componentProduct.stock}.`);
            }
        }

        for (const component of bundleProduct.bundleComponents) {
            await Product.findByIdAndUpdate(
                component.product,
                { $inc: { stock: - (component.quantity * quantitySold) } },
                { session, new: true }
            );
        }

        // After deducting components, recalculate the bundle's stock
        const { calculatedStock } = await calculateBundleDetails(bundleProduct.bundleComponents);
        await Product.findByIdAndUpdate(
            bundleProductId,
            { stock: calculatedStock },
            { session, new: true }
        );


        console.log(`Successfully deducted stock for ${quantitySold} units of bundle ${bundleProduct.name}.`);
        return { success: true, message: `Stock deducted for bundle ${bundleProduct.name}.` };

    } catch (error) {
        console.error('Error deducting bundle components stock:', error.message);
        throw error;
    }
};

// @desc    Revert stock for bundle components when a bundle product order is cancelled/deleted
// This function will be called by the order controller
const revertBundleComponentsStock = async (bundleProductId, quantityReverted, session) => {
    if (!mongoose.Types.ObjectId.isValid(bundleProductId)) {
        throw new Error('Invalid bundle product ID for stock reversion.');
    }
    if (typeof quantityReverted !== 'number' || quantityReverted <= 0) {
        throw new Error('Quantity reverted must be a positive number for stock reversion.');
    }

    if (!session) {
        throw new Error('Mongoose session is required for revertBundleComponentsStock.');
    }

    try {
        const bundleProduct = await Product.findById(bundleProductId).session(session);

        if (!bundleProduct) {
            throw new Error(`Bundle product with ID ${bundleProductId} not found for stock reversion.`);
        }
        if (!bundleProduct.isBundle) {
            throw new Error(`Product ${bundleProduct.name} (ID: ${bundleProductId}) is not a bundle. Stock reversion for components is not applicable.`);
        }
        if (bundleProduct.bundleComponents.length === 0) {
            throw new Error(`Bundle product ${bundleProduct.name} has no components defined for reversion.`);
        }

        for (const component of bundleProduct.bundleComponents) {
            await Product.findByIdAndUpdate(
                component.product,
                { $inc: { stock: (component.quantity * quantityReverted) } },
                { session, new: true }
            );
        }

        // After reverting components, recalculate the bundle's stock
        const { calculatedStock } = await calculateBundleDetails(bundleProduct.bundleComponents);
        await Product.findByIdAndUpdate(
            bundleProductId,
            { stock: calculatedStock },
            { session, new: true }
        );

        console.log(`Successfully reverted stock for ${quantityReverted} units of bundle ${bundleProduct.name}.`);
        return { success: true, message: `Stock reverted for bundle ${bundleProduct.name}.` };

    } catch (error) {
        console.error('Error reverting bundle components stock:', error.message);
        throw error;
    }
};


module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getProductCount,
    getTotalStock,
    getAllProductsList,
    deductBundleComponentsStock,
    revertBundleComponentsStock,
};
