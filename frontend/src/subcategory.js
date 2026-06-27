import React, { useState, useEffect } from 'react';
import {
    Button, Box, AppBar, Toolbar, TextField, Table, TableBody, TableCell,
    TableContainer, Menu, TableHead, TableRow, Paper, IconButton, Typography,
    MenuItem, Select, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions // Added missing Dialog components
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';           // Added missing import
import VisibilityIcon from '@mui/icons-material/Visibility'; // Added missing import
import { useNavigate } from 'react-router-dom';

const API_SUB_URL = 'http://localhost:5000/subcategories';
const API_CAT_URL = 'http://localhost:5000/categories';


export default function SubCategoryCRUD() {
    const navigate = useNavigate();

    // States
    const [subCategories, setSubCategories] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [inputSubName, setInputSubName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState('');

    // Navbar Anchor State
    const [dashboardAnchor, setDashboardAnchor] = useState(null);
    const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);


    // --- Added missing Modal / Dialog States for Subcategories ---
    const [opendialog, setOpenDialog] = useState(null);
    const [dialogMode, setDialogMode] = useState(''); // 'view' or 'edit'
    const [editValue, setEditValue] = useState('');

    // 1. Fetch both Subcategories and Parent Categories on mount
    useEffect(() => {
        fetch(API_SUB_URL)
            .then(res => res.json())
            .then(data => setSubCategories(data));

        fetch(API_CAT_URL)
            .then(res => res.json())
            .then(data => setParentCategories(data));
    }, []);

    // 2. CREATE: Save Subcategory to DB
    const handleAddSubCategory = async () => {
        if (!inputSubName.trim() || !selectedParentId) return;

        try {
            const response = await fetch(API_SUB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: inputSubName.trim(),
                    categoryId: selectedParentId
                })
            });

            if (response.ok) {
                const refreshRes = await fetch(API_SUB_URL);
                const updatedData = await refreshRes.json();
                setSubCategories(updatedData);
                setInputSubName('');
                setSelectedParentId('');
            }
        } catch (err) {
            console.error(err);
        }
    };
    const handleClearSubCategory = () => {
        setInputSubName('');
        setSelectedParentId('');
    }

    // 3. DELETE: Remove Subcategory from DB
    const handleDeleteSub = async (id) => {
        try {
            const response = await fetch(`${API_SUB_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setSubCategories(subCategories.filter(sub => sub.id !== id && sub._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Added missing Action functions for Dialog box ---
    const handleOpenDialog = (subcategory, mode) => {
        setOpenDialog(subcategory);
        setDialogMode(mode);
        if (mode === 'edit') {
            setEditValue(subcategory.name);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(null);
        setDialogMode('');
    };

    const handleSaveEdit = async () => {
        const targetId = opendialog.id || opendialog._id;
        try {
            const response = await fetch(`${API_SUB_URL}/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editValue.trim() })
            });

            if (response.ok) {
                // Refresh to get updated data cleanly populated from DB
                const refreshRes = await fetch(API_SUB_URL);
                const updatedData = await refreshRes.json();
                setSubCategories(updatedData);
                handleCloseDialog();
            }
        } catch (error) {
            console.error("Error updating subcategory:", error);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            {/* NAVBAR */}
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

            <Typography variant="h4" sx={{ mb: 5, mt: 5 }}>Sub Category Management</Typography>

            {/* INPUT FORM WITH DROPDOWN */}
            <Box sx={{ display: 'flex', gap: 2, mb: 5, maxWidth: 600, alignItems: 'center' }}>
                {/* Parent Category Selector */}
                <FormControl size="large" sx={{ minWidth: 300, ml: 10, mr: 5 }}>
                    <InputLabel id="parent-cat-label">Parent Category</InputLabel>
                    <Select
                        labelId="parent-cat-label"
                        value={selectedParentId}
                        label="Parent Category"
                        onChange={(e) => setSelectedParentId(e.target.value)}
                    >
                        {parentCategories

                            .map((cat) => (
                                <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                                    {cat.name}
                                </MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>

                <TextField
                    label="Sub Category Name" variant="outlined" size="large" fullWidth sx={{ minWidth: 300 }}
                    value={inputSubName} onChange={(e) => setInputSubName(e.target.value)}
                />

                <Button variant="contained" color="primary" size='large' onClick={handleAddSubCategory}>
                    Add
                </Button>
                <Button variant="contained" color="error" size='large' onClick={handleClearSubCategory}>
                    clear
                </Button>
            </Box>

            {/* TABLE VIEW */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Sub Category</strong></TableCell>
                            <TableCell><strong>Main Category</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subCategories.map((sub, index) => (
                            <TableRow key={sub._id || sub.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{sub.name}</TableCell>
                                <TableCell>{sub.category?.name || "Unassigned"}</TableCell>
                                <TableCell align="right">
                                    {/* FIXED: Wired up View Icon button */}
                                    <IconButton color="info" onClick={() => handleOpenDialog(sub, 'view')}>
                                        <VisibilityIcon />
                                    </IconButton>
                                    {/* FIXED: Wired up Edit Icon button */}
                                    <IconButton color="warning" onClick={() => handleOpenDialog(sub, 'edit')}>
                                        <EditIcon />
                                    </IconButton>
                                    {/* Delete Icon */}
                                    <IconButton color="error" onClick={() => handleDeleteSub(sub._id || sub.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* FIXED: Cleared up missing state references */}
                        {subCategories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No subcategories available. Add one above!</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* DYNAMIC DIALOG (FOR VIEW & EDIT) */}
            <Dialog open={Boolean(opendialog)} onClose={handleCloseDialog}>
                <DialogTitle>{dialogMode === 'edit' ? 'Edit Sub Category' : 'Sub Category Details'}</DialogTitle>
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
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ mb: 1 }}><strong>Sub Category:</strong> {opendialog?.name}</Typography>
                            <Typography><strong>Parent Category:</strong> {opendialog?.category?.name || "Unassigned"}</Typography>
                        </Box>
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