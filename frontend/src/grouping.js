import React, { useState, useEffect } from 'react';
import {
  Button, Box, AppBar, Toolbar, TextField, Table, TableBody, TableCell,
  TableContainer, Menu, TableHead, TableRow, Paper, IconButton, Typography,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

const API_PROD_URL = 'http://localhost:5000/products';
const API_SUB_URL = 'http://localhost:5000/subcategories';
const API_CAT_URL = 'http://localhost:5000/categories';

export default function GroupingCRUD() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  // Creation States
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  // Dialog / Modal Editing States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const [dashboardAnchor, setDashboardAnchor] = useState(null);
  const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);
  // 1. Fetch data on component mount
  useEffect(() => {
    fetch(API_CAT_URL).then(res => res.json()).then(data => setCategories(data));
    fetch(API_SUB_URL).then(res => res.json()).then(data => setAllSubCategories(data));
    fetch(API_PROD_URL).then(res => res.json()).then(data => setProducts(data));
  }, []);

  // 2. CREATE: Add product to DB
  const handleAddProduct = async () => {
    if (!productName.trim() || !productPrice || !selectedSubId)
      return;
    try {
      const response = await fetch(API_PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName.trim(),
          price: Number(productPrice),
          subCategoryId: selectedSubId
        })
      });

      if (response.ok) {
        const refreshRes = await fetch(API_PROD_URL);
        const updatedProds = await refreshRes.json();
        setProducts(updatedProds);
        setSelectedCatId('');
        setSelectedSubId('');
        setProductName('');
        setProductPrice('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. UPDATE: Open dialog and populate fields
  const openEditDialog = (product) => {
    setEditingId(product._id || product.id);
    setEditName(product.name);
    setEditPrice(product.price);
    setIsDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  };

  // Save changes from Dialog to DB
  const handleUpdateProduct = async () => {
    if (!editName.trim() || !editPrice) return;
    try {
      const response = await fetch(`${API_PROD_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), price: Number(editPrice) })
      });

      if (response.ok) {
        const refreshRes = await fetch(API_PROD_URL);
        const updatedProds = await refreshRes.json();
        setProducts(updatedProds);
        closeEditDialog(); // Close dialog on success
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. DELETE: Remove product from DB
  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_PROD_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p._id !== id && p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSubCategories = allSubCategories.filter(sub => {
    const parentId = sub.category?._id || sub.category?.id;
    return parentId === selectedCatId;
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>

      {/* Navbar */}

      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar sx={{ gap: 2 }}>

          {/* 1. Categories Menu Section */}
          <Box onMouseLeave={() => setDashboardAnchor(null)}>
            <Button
              id="dashboard-button"
              color="inherit"
              onMouseEnter={(e) => setDashboardAnchor(e.currentTarget)}
            >
              Categories
            </Button>
            <Menu
              id="dashboard-menu"
              anchorEl={dashboardAnchor}
              open={Boolean(dashboardAnchor)}
              onClose={() => setDashboardAnchor(null)}
              MenuListProps={{
                onMouseEnter: () => setDashboardAnchor(document.getElementById('dashboard-button')),
                onMouseLeave: () => setDashboardAnchor(null)
              }}
            >
               <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/dashboard'); }}>
              Categories
              </MenuItem>
              <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/subcategories'); }}>
               Sub Categories
              </MenuItem>
              
              <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/dates'); }}>
                Dates
              </MenuItem>
            </Menu>
          </Box>

          {/* 2. File Upload Menu Section */}
          <Box onMouseLeave={() => setDashboardAnchorFileUpload(null)}>
            <Button
              id="dashboardFileUpload-button"
              color="inherit"
              onMouseEnter={(e) => setDashboardAnchorFileUpload(e.currentTarget)}
            >
              File Upload
            </Button>
            <Menu
              id="fileupload-menu"
              anchorEl={dashboardAnchorFileUpload}
              open={Boolean(dashboardAnchorFileUpload)}
              onClose={() => setDashboardAnchorFileUpload(null)}
              MenuListProps={{
                onMouseEnter: () => setDashboardAnchorFileUpload(document.getElementById('dashboardFileUpload-button')),
                onMouseLeave: () => setDashboardAnchorFileUpload(null)
              }}
            >
              {/* Replace these navigation paths with your actual routes */}
              <MenuItem onClick={() => { setDashboardAnchorFileUpload(null); navigate('/singleFileUpload'); }}>
                Single File Upload
              </MenuItem>
              <MenuItem onClick={() => { setDashboardAnchorFileUpload(null); navigate('/multipleFileUpload'); }}>
                Multiple File Upload
              </MenuItem>

            </Menu>
          </Box>

        </Toolbar>
      </AppBar>

      <Typography variant="h4" sx={{ mb: 5 }}> Grouping</Typography>

      {/* CASCADING DROPDOWNS FORM */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 5, alignItems: 'center' }}>
        <FormControl size="large" sx={{ minWidth: 250 }}>
          <InputLabel id="main-cat-label">1. Select Main Category</InputLabel>
          <Select
            labelId="main-cat-label" value={selectedCatId} label="1. Select Main Category"
            onChange={(e) => { setSelectedCatId(e.target.value); setSelectedSubId(''); }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="large" sx={{ minWidth: 250 }} disabled={!selectedCatId}>
          <InputLabel id="dependent-sub-label">2. Select Subcategory</InputLabel>
          <Select
            labelId="dependent-sub-label" value={selectedSubId} label="2. Select Subcategory"
            onChange={(e) => setSelectedSubId(e.target.value)}
          >
            {filteredSubCategories.map((sub) => (
              <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Product Name" variant="outlined" size="large" disabled={!selectedSubId}
          value={productName} onChange={(e) => setProductName(e.target.value)}
        />
        <TextField
          label="Price" type="number" variant="outlined" size="large" disabled={!selectedSubId}
          value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
        />

        <Button
          variant="contained" color="primary" size="large"
          disabled={!selectedSubId || !productName.trim() || !productPrice}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>

      {/* RENDER DATA TABLE */}
      <Typography variant="h5" sx={{ mb: 2 }}>Grouped List</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Main Category</strong></TableCell>
              <TableCell><strong>Sub Category</strong></TableCell>
              <TableCell><strong>Product Item Name</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell align="right"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((prod, index) => {
              const pId = prod._id || prod.id;

              return (
                <TableRow key={pId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell >
                    {prod.subCategory?.category?.name || "Unassigned"}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {prod.subCategory?.name || "Unassigned"}
                  </TableCell>
                  <TableCell>{prod.name}</TableCell>
                  <TableCell>Rs.{prod.price}</TableCell>

                  {/* Action Panel */}
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openEditDialog(prod)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteProduct(pId)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No grouped items configured.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* EDITING DIALOG MODAL */}
      <Dialog open={isDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs">
        <DialogTitle>Edit Product Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField sx={{ mt: 2 }}
            label="Product Name" variant="outlined" fullWidth size='large'
            value={editName} onChange={(e) => setEditName(e.target.value)}

          />
          <TextField
            label="Price" type="number" variant="outlined" fullWidth
            value={editPrice} onChange={(e) => setEditPrice(e.target.value)}

          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={closeEditDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProduct} variant="contained"
            disabled={!editName.trim() || !editPrice}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}