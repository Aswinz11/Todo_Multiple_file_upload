import React, { useState, useEffect } from 'react';
import {
  Button, Menu, MenuItem, Box, AppBar, Toolbar, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/categories';

export default function CategoryCRUD() {
  const navigate = useNavigate();

  const [dashboardAnchor, setDashboardAnchor] = useState(null);
  const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);

  const [categories, setCategories] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [opendialog, setOpenDialog] = useState(null);
  const [dialogMode, setDialogMode] = useState('');
  const [editValue, setEditValue] = useState('');


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setCategories(data);
      }
      catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!inputValue)
      return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputValue })
      });

      if (response.ok) {
        const savedCategory = await response.json();
        setCategories([...categories, savedCategory]);
        setInputValue('');
      } else {
        console.error("failed to save.");
      }
    }
    catch (error) {
      console.error('Cannot connect to backend server:', error);
    }
  };

  const handleClearCategory = () => {
    setInputValue('');
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== id));
        console.log("Deleted from DB and UI successfully!");
      } else {
        console.error("Failed to delete from backend database.");
      }
    } catch (error) {
      console.error("Network error connecting to backend:", error);
    }
  };

  const handleOpenDialog = (category, mode) => {
    setOpenDialog(category);
    setDialogMode(mode);
    if (mode === 'edit') {
      setEditValue(category.name);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setDialogMode('');
  };

  const handleSaveEdit = async () => {
    const targetId = opendialog.id || opendialog._id;
    try {
      const response = await fetch(`${API_URL}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue })
      });
      if (response.ok) {
        setCategories(categories.map(cat =>
          (cat.id === targetId || cat._id === targetId) ? { ...cat, name: editValue } : cat
        ));
        handleCloseDialog();
        console.log("Updated in DB successfully!");
      } else {
        console.error("Failed to update entry in MongoDB");
      }
    } catch (error) {
      console.error("Error updating database entry:", error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* 1. NAVBAR SECTION */}
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
              <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/subcategories'); }}>
                 Sub Categories
              </MenuItem>
              <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/products'); }}>
                Grouping
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

      {/* 2. INPUT FIELD SECTION (ADD CATEGORY) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 7, ml: 10, mt: 10, maxWidth: 500 }}>
        <TextField
          label="Category Name"
          variant="outlined"
          fullWidth
          size="medium"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleAddCategory}>
          Add
        </Button>
        <Button variant="contained" color="error" onClick={handleClearCategory}>
          Clear
        </Button>
      </Box>

      {/* 3. TABLE VIEW SECTION */}
      <Typography variant="h5" sx={{ mb: 2 }}>Category List</Typography>
      <TableContainer component={Paper}>
        <Table aria-label="category table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Category Name</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id || category._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell align="right">
                  <IconButton color="info" onClick={() => handleOpenDialog(category, 'view')}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton color="warning" onClick={() => handleOpenDialog(category, 'edit')}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(category.id || category._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No categories available. Add one above!</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. DYNAMIC DIALOG (FOR VIEW & EDIT) */}
      <Dialog open={Boolean(opendialog)} onClose={handleCloseDialog}>
        <DialogTitle>{dialogMode === 'edit' ? 'Edit Category' : 'Category Details'}</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 1 }}>
          {dialogMode === 'edit' ? (
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              sx={{ mt: 1 }}
            />
          ) : (
            <Typography><strong>Name:</strong> {opendialog?.name}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {dialogMode === 'edit' && (
            <Button onClick={handleSaveEdit} variant="contained" color="primary">Save</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
