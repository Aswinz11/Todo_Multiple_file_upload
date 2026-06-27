const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const app = express();
const path = require('path');
const fs = require('fs');

// Middleware
app.use(express.json());
app.use(cors());
app.use('/mulUploads', express.static(path.join(__dirname, 'mulUploads')));
app.use('/uploads', express.static('uploads'));

// 1. Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/MultipleFileUpload")
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

const singleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Math.random().toString(36).substring(7)}${extension}`);
  }
});
const upload = multer({
  storage: singleStorage, limits: { fileSize: 1024 * 1024 * 5 }
});

//Multiple multer
const multiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'mulUploads/');
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, Date.now() + '-' + extension);
  }
});
const uploadMulti = multer({ storage: multiStorage, limits: { fileSize: 1024 * 1024 * 3 } });

// 2. User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// 2.1 Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }
});
const Category = mongoose.model("Category", categorySchema);

// 2.2 Subcategory Schema
const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
});
const SubCategory = mongoose.model("SubCategory", subCategorySchema);

// 2.3 Product/Grouping Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true }
}, { timestamps: true });
const Product = mongoose.model('Product', ProductSchema);


// 2.4 Date Schema
const DateSchema = new mongoose.Schema({
  todoName: { type: String, required: true, trim: true },
  items: [{
    date: { type: Date, required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true }
  }]
}, { timestamps: true });
const DateModel = mongoose.model('Date', DateSchema);

// 2.5 File Record Schema
const FileGroupSchema = new mongoose.Schema({
  mainName: { type: String, required: true },

  items: [{
    uploadName: String,
    originalFileName: String,
    savedFileName: String,
    filePath: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const FileGroup = mongoose.model('FileGroup', FileGroupSchema);

//Multiple file record schema
const MultipleFileGroupSchema = new mongoose.Schema({
  mainName: { type: String, required: true },
  date: { type: Date, required: true },
  uploadName: { type: String, required: true },
  items: [{
    originalFileName: String,
    savedFileName: String,
    filePath: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const MultipleFileGroup = mongoose.model('MultipleFileGroup', MultipleFileGroupSchema);


// 3. Login Route
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  if (user.password !== req.body.password) {
    return res.status(400).json({ message: "Wrong password" });
  }
  res.json({ message: "Login success" });
});

// Category Routes
app.post("/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Category name is required" });
  try {
    const newCategory = new Category({ name });
    const savedCategory = await newCategory.save();
    return res.status(201).json({ id: savedCategory._id, name: savedCategory.name });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create category" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories.map(cat => ({ id: cat._id, name: cat.name })));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
});

app.put("/categories/:id", async (req, res) => {
  const { name } = req.body;
  try {
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { name }, { returnDocument: 'after' });
    if (!updatedCategory) return res.status(404).json({ message: "Category not found" });
    return res.status(200).json({ id: updatedCategory._id, name: updatedCategory.name });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update category" });
  }
});

app.delete("/categories/:id", async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ message: "Category not found" });
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
});

// Subcategory Routes
app.post("/subcategories", async (req, res) => {
  const { name, categoryId } = req.body;
  if (!name || !categoryId) return res.status(400).json({ message: "Subcategory name and Parent Category ID are required" });
  try {
    const newSubCategory = new SubCategory({ name, category: categoryId });
    const savedSub = await newSubCategory.save();
    const populatedSub = await SubCategory.findById(savedSub._id).populate('category', 'name');
    return res.status(201).json(populatedSub);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create subcategory" });
  }
});

app.get("/subcategories", async (req, res) => {
  try {
    const subs = await SubCategory.find().populate('category', 'name');
    return res.status(200).json(subs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch subcategories" });
  }
});

app.put("/subcategories/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Subcategory name is required for updates" });
  try {
    const updatedSub = await SubCategory.findByIdAndUpdate(req.params.id, { name: name.trim() }, { returnDocument: 'after' }).populate('category', 'name');
    if (!updatedSub) return res.status(404).json({ message: "Subcategory not found" });
    return res.status(200).json(updatedSub);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update subcategory" });
  }
});

app.delete("/subcategories/:id", async (req, res) => {
  try {
    const deletedSub = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deletedSub) return res.status(404).json({ message: "Subcategory not found" });
    return res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete subcategory" });
  }
});

// Product Routes
app.post('/products', async (req, res) => {
  try {
    const { name, price, subCategoryId } = req.body;
    if (!name || !price || !subCategoryId) return res.status(400).json({ message: 'Missing required fields' });
    const newProduct = new Product({ name, price: Number(price), subCategory: subCategoryId });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while saving product.' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().populate({ path: 'subCategory', populate: { path: 'category' } });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching products.' });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { name, price } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { name, price: Number(price) }, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating product.' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting product.' });
  }
});
// Date Routes
app.post('/dates', async (req, res) => {
  try {
    const { todoName, items } = req.body;

    if (!todoName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing todoName or items array collection.' });
    }

    const structuredItems = items.map(item => ({
      date: item.date,
      subCategory: item.subCategoryId || item.subCategory
    }));

    const newDateGroup = new DateModel({
      todoName: todoName.trim(),
      items: structuredItems
    });

    await newDateGroup.save();
    res.status(201).json(newDateGroup);
  } catch (error) {
    console.error("Error creating date entry array:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET
app.get('/dates', async (req, res) => {
  try {
    const data = await DateModel.find().populate({
      path: 'items.subCategory',
      populate: { path: 'category' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT
app.put('/dates/:id', async (req, res) => {
  try {
    const { todoName, items } = req.body;
    const updatePayload = {};

    if (todoName) updatePayload.todoName = todoName.trim();
    if (items && Array.isArray(items)) {
      updatePayload.items = items.map(item => ({
        date: item.date,
        subCategory: item.subCategoryId || item.subCategory
      }));
    }

    const updatedDate = await DateModel.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    ).populate({
      path: 'items.subCategory',
      populate: { path: 'category' }
    });

    if (!updatedDate) {
      return res.status(404).json({ message: 'Date group record not found' });
    }
    res.json(updatedDate);
  } catch (err) {
    console.error('Error updating date array details:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE
app.delete('/dates/:id', async (req, res) => {
  try {
    const deletedDate = await DateModel.findByIdAndDelete(req.params.id);
    if (!deletedDate) {
      return res.status(404).json({ message: 'Date collection not found.' });
    }
    res.json({ message: 'Date group dropped from database collections successfully.' });
  } catch (err) {
    console.error('Error dropping date element collection:', err);
    res.status(500).json({ error: 'Server error while clearing collection element.' });
  }
});


// Make sure you have multer configured somewhere above this!
// const upload = multer({ dest: 'uploads/' });

app.post('/uploads', async (req, res) => {
  const uploadFiles = upload.array('files');

  uploadFiles(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const mainName = req.body.name;
      const parsedItems = req.body.itemsData ? JSON.parse(req.body.itemsData) : [];
      const safeFilesArray = req.files || [];

      const combinedItems = parsedItems.map((item, index) => {
        const uploadedFile = safeFilesArray[index];
        return {
          uploadName: item.uploadName,
          originalFileName: uploadedFile ? uploadedFile.originalname : 'No File',
          savedFileName: uploadedFile ? uploadedFile.filename : '',
          filePath: uploadedFile ? uploadedFile.path : ''
        };
      });

      const newRecord = new FileGroup({ mainName: mainName, items: combinedItems });
      await newRecord.save();

      res.status(201).json({ message: "Successfully saved!", record: newRecord });
    } catch (error) {
      console.error("Database save error:", error);
      res.status(500).json({ error: "Failed to save files" });
    }
  });
});

// 4. GET Route (Read)
app.get('/uploads', async (req, res) => {
  try {
    const records = await FileGroup.find().sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Add this route near your other GET routes
app.get('/upload-item-names', async (req, res) => {
  try {
    const records = await FileGroup.find().select('items.uploadName items._id').sort({ createdAt: -1 });
    let allItemNames = [];
    records.forEach(record => {
      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          if (item.uploadName) {
            allItemNames.push({
              recordId: record._id,
              itemId: item._id,
              uploadName: item.uploadName
            });
          }
        });
      }
    });
    res.status(200).json(allItemNames);

  } catch (error) {
    console.error("Error fetching item names:", error);
    res.status(500).json({ error: "Failed to fetch item names" });
  }
});

// 5. PUT Route (Update existing record)
app.put('/uploads/:id', async (req, res) => {
  const uploadFiles = upload.array('files');

  uploadFiles(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File is too large. Maximum size is 5MB." });
      }
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "An unknown error occurred during upload." });
    }
    try {
      const mainName = req.body.name;
      // Parse the items array that tells us what to keep and what is new
      const parsedItems = req.body.itemsData ? JSON.parse(req.body.itemsData) : [];
      const safeFilesArray = req.files || [];

      let newFileIndex = 0; // Tracks which file belongs to which 'new' item

      // Rebuild the items array
      const updatedItems = parsedItems.map((item) => {
        if (item.isExisting) {
          // Keep the old data exactly as it was
          return {
            uploadName: item.uploadName, // Might have been inline-edited
            originalFileName: item.originalName,
            savedFileName: item.savedFilename,
            filePath: item.path
          };
        } else {
          // Attach the newly uploaded file data
          const uploadedFile = safeFilesArray[newFileIndex];
          newFileIndex++;

          return {
            uploadName: item.uploadName,
            originalFileName: uploadedFile ? uploadedFile.originalname : 'No File',
            savedFileName: uploadedFile ? uploadedFile.filename : '',
            filePath: uploadedFile ? uploadedFile.path : ''
          };
        }
      });

      // Update the record in MongoDB
      const updatedRecord = await FileGroup.findByIdAndUpdate(
        req.params.id,
        { mainName: mainName, items: updatedItems },
        { new: true } // Returns the updated document
      );

      res.status(200).json({ message: "Successfully updated record!", record: updatedRecord });

    } catch (error) {
      console.error("Database update error:", error);
      res.status(500).json({ error: "Failed to update record" });
    }
  });
});

app.delete('/uploads/:id', async (req, res) => {
  try {
    const recordId = req.params.id;

    // 1. Find the record in the database FIRST using FileGroup
    const recordToDelete = await FileGroup.findById(recordId);

    if (!recordToDelete) {
      return res.status(404).json({ message: "Record not found" });
    }

    // 2. Loop through the items and delete the physical files
    if (recordToDelete.items && recordToDelete.items.length > 0) {
      recordToDelete.items.forEach(item => {

        const filePath = path.join(__dirname, 'uploads', item.savedFileName);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileErr) {
            console.error(`Error deleting file ${item.savedFileName}:`, fileErr);
          }
        }
      });
    }

    // 3. Delete the record from the database using FileGroup
    await FileGroup.findByIdAndDelete(recordId);

    res.status(200).json({ message: "Record and associated files deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
});


// 3. POST Route (Create new record)


// 4. GET Route (Read)
app.get('/mulUploads', async (req, res) => {
  try {
    const records = await MultipleFileGroup.find().sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });

  }
});
app.post('/mulUploads', uploadMulti.array('files'), async (req, res) => {
  try {
    const { name, date, uploadName } = req.body;
    const safeFilesArray = req.files || [];

    const combinedItems = safeFilesArray.map((uploadedFile) => ({
      originalFileName: uploadedFile.originalname,
      savedFileName: uploadedFile.filename,
      filePath: uploadedFile.path
    }));

    const newRecord = new MultipleFileGroup({
      mainName: name,
      date,
      uploadName,
      items: combinedItems
    });

    await newRecord.save();
    res.status(201).json({ message: "Successfully saved!", record: newRecord });
  } catch (error) {
    console.error("Database save error:", error);
    res.status(500).json({ error: "Failed to save files" });
  }
});

// PUT Route (Update) - Robust Version
app.put('/mulUploads/:id', async (req, res) => {
  uploadMulti.array('files')(req, res, async function (err) {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, date, uploadName, itemsData } = req.body;
      const parsedItems = itemsData ? JSON.parse(itemsData) : [];
      const safeFilesArray = req.files || [];

      const updatedItems = parsedItems.map((item) => {
        if (item.isExisting) {
          return {
            originalFileName: item.originalName,
            savedFileName: item.savedFilename,
            filePath: item.path
          };
        } else {
          const uploadedFile = safeFilesArray.find(f => f.originalname === item.originalName);
          return {
            originalFileName: uploadedFile ? uploadedFile.originalname : item.originalName,
            savedFileName: uploadedFile ? uploadedFile.filename : '',
            filePath: uploadedFile ? uploadedFile.path : ''
          };
        }
      });
      const updatedRecord = await MultipleFileGroup.findByIdAndUpdate(
        req.params.id,
        { mainName: name, date, uploadName, items: updatedItems },
        { returnDocument: 'after' }
      );
      res.status(200).json({ message: "Updated!", record: updatedRecord });
    } catch (error) {
      res.status(500).json({ error: "Failed to update record" });
    }
  });
});
// DELETE Route
app.delete('/mulUploads/:id', async (req, res) => {
  try {
    const recordToDelete = await MultipleFileGroup.findById(req.params.id);
    if (!recordToDelete) return res.status(404).json({ message: "Not found" });
    recordToDelete.items.forEach(item => {
      if (item.savedFileName) {
        const filePath = path.join(__dirname, 'mulUploads', item.savedFileName);
        if (fs.existsSync(filePath))
           fs.unlinkSync(filePath);
      }
    });
    await MultipleFileGroup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Start backend on Port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}
);