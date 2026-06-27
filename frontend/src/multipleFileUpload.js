import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
    AppBar, Toolbar, Box, Menu, MenuItem, Paper, TextField, Typography,
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Fab from '@mui/material/Fab';
import FirstComponent from './todoDatepickerCom';
import dayjs from 'dayjs';
import { Stack } from '@mui/material';

// Custom Components & Utils
import MultipleFileUploadTable from './multipleFileUploadTable';
import axios from 'axios';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const API_URL = 'http://localhost:5000/mulUploads';

export default function MultipleFileUpload() {
    const navigate = useNavigate();

    // Nav State
    const [dashboardAnchor, setDashboardAnchor] = useState(null);
    const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [uploadName, setUploadName] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [items, setItems] = useState([]);
    const [date, setDate] = useState(null);

    // Dropdown State for Upload Names
    const [dropdownItems, setDropdownItems] = useState([]);

    // Inline Edit State (Local Table)
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const [editLocalFile, setEditLocalFile] = useState(null);

    // Table Data State
    const [tableRows, setTableRows] = useState([]);

    // --- VIEW DIALOG STATE ---
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewButton, setViewButton] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // --- EDIT DIALOG STATE ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editDate, setEditDate] = useState(null);
    const [editRecordId, setEditRecordId] = useState('');
    const [editMainName, setEditMainName] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [editUploadNameInput, setEditUploadNameInput] = useState('');

    // CHANGED: Use an array for multiple selected files in the modal
    const [editSelectedFiles, setEditSelectedFiles] = useState([]);

    const [modalInlineEditId, setModalInlineEditId] = useState(null);
    const [modalInlineEditName, setModalInlineEditName] = useState('');
    const [modalInlineEditFile, setModalInlineEditFile] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchTableData();
        fetchDropdownItems();
    }, []);

    const fetchTableData = async () => {
        try {
            const response = await axios.get(API_URL);
            const formattedData = response.data.map(record => ({
                _id: record._id,
                name: record.mainName || "Unknown Name",
                date: record.date ? new Date(record.date).toLocaleDateString() : "Unknown Date",
                uploadName: record.uploadName,
                files: record.items ? record.items.map(item => ({
                    originalName: item.originalFileName || "no name",
                    savedFilename: item.savedFileName,
                    path: item.filePath
                })) : []
            }));

            setTableRows(formattedData);
        } catch (error) {
            console.error("Failed to fetch table data:", error);
        }
    };

    const fetchDropdownItems = async () => {
        try {
            const response = await axios.get('http://localhost:5000/upload-item-names');
            setDropdownItems(response.data);
        } catch (error) {
            console.error("Failed to fetch dropdown names:", error);
        }
    };

    // --- Local Form Handlers ---
    const handleAddItems = () => {
        if (!uploadName.trim()) { alert("Please select an Upload Name"); return; }
        if (selectedFiles.length === 0) { alert("Please select at least one file before adding"); return; }
        if (!date) { alert("Please select a date"); return; }

        let newItemsToAdd = [];
        let duplicateFiles = [];

        selectedFiles.forEach((currentFile, index) => {
            const isDuplicate = items.some(item => item.file.name === currentFile.name);

            if (isDuplicate) {
                duplicateFiles.push(currentFile.name);
            } else {
                newItemsToAdd.push({
                    id: Date.now() + index,
                    uploadName: uploadName.trim(),
                    file: currentFile,
                    date: date
                });
            }
        });

        if (duplicateFiles.length > 0) {
            alert(`These files were already added and were skipped:\n${duplicateFiles.join(', ')}`);
        }
        if (newItemsToAdd.length > 0) {
            setItems([...items, ...newItemsToAdd]);
        }

        setSelectedFiles([]);
    };

    const handleRemoveItem = (idToRemove) => {
        setItems(items.filter(item => item.id !== idToRemove));
    };

    const handleClear = () => {
        setItems([]);
        setUploadName('');
        setName('');
        setSelectedFiles([]);
        setDate(null);
    };

    const handleViewLocalFile = (file) => {
        if (file) {
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        }
    };

    const handleEditStart = (item) => {
        setEditingId(item.id);
        setEditName(item.uploadName);
        setEditLocalFile(item.file);
    };

    const handleEditSave = (id) => {
        if (!editName.trim()) { alert("Name cannot be empty"); return; }
        setItems(items.map(item => item.id === id ? { ...item, uploadName: editName.trim(), file: editLocalFile } : item));
        setEditingId(null);
        setEditName('');
        setEditLocalFile(null);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditName('');
        setEditLocalFile(null);
    };

    // --- Backend Integration Handlers ---
    const handleUpload = async () => {

        if (!name || items.length === 0) {
            alert("Please provide a main Name and add at least one item.");
            return;
        }
        if (!date) {
            alert("Please select a date");
            return;
        }
        if (!uploadName) {
            alert("Please select an Upload Name");
            return;
        }

        // 2. Duplicate check
        const isNameDuplicate = tableRows.some(
            row => row.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (isNameDuplicate) {
            alert("This Name is already taken. Please choose a different name.");
            return;
        }

        // 3. Precise File Size Validation (The Fix)
        const MAX_SIZE = 3 * 1024 * 1024; // 3MB in bytes
        const largeFiles = items.filter(item => item.file && item.file.size > MAX_SIZE);

        if (largeFiles.length > 0) {
            const largeFileNames = largeFiles.map(item => item.file.name).join(", ");
            alert(`This file(s) are larger than 3MB :\n${largeFileNames}`);
            return; // Stop the function here
        }



        // 4. Proceed with Upload
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('date', date);
            formData.append('uploadName', uploadName)
            items.forEach(item => {
                if (item.file) formData.append('files', item.file);
            });

            await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Reset UI
            setItems([]);
            setName('');
            setUploadName('');
            setSelectedFiles([]);
            setDate(null);
            fetchTableData();
            alert("Files uploaded successfully!");
        } catch (err) {
            console.error("Error creating record:", err);
            alert("Upload failed. Please check the server or try again later.");
        }
    };

    const handleDeleteRecord = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchTableData();
        } catch (error) {
            console.error("Failed to delete record:", error);
        }
    };

    const handleViewSavedRecord = (row) => {
        if (row) {
            setSelectedRecord(row);
            setViewDialogOpen(true);
        }
    };

    const handleViewButton = (row) => {
        if (row) {
            setSelectedRecord(row);
            setViewButton(true);
        }
    };

    // --- EDIT DIALOG HANDLERS ---
    const handleEditSavedRecord = (row) => {
        setEditRecordId(row._id);
        setEditMainName(row.name);
        setEditUploadNameInput(row.uploadName || '');
        setEditDate(row.date ? dayjs(row.date) : null);

        // CORRECTED MAPPING: Ensure originalName is pulled from the file object, not the category
        const mappedItems = row.files.map((f, i) => ({
            id: `existing_${i}`,
            uploadName: row.uploadName,
            originalName: f.originalName, // This must be the actual filename
            isExisting: true,
            path: f.path,
            savedFilename: f.savedFilename,
            file: null
        }));

        setEditItems(mappedItems);
        setEditModalOpen(true);
    };

    // CHANGED: Loop through editSelectedFiles array to handle multiple files
    const handleModalAddItem = () => {
        if (!editUploadNameInput.trim() || editSelectedFiles.length === 0) {
            alert("Please enter a name and select at least one file.");
            return;
        }

        const newItems = editSelectedFiles.map((file, i) => ({
            id: Date.now() + i,
            uploadName: editUploadNameInput.trim(),
            file: file,
            originalName: file.name || "UnknownFile", // Fallback to prevent "fqq" or undefined
            isExisting: false
        }));

        setEditItems([...editItems, ...newItems]);
        setEditSelectedFiles([]); // Clear the array
    };

    const handleModalRemoveItem = (idToRemove) => {
        setEditItems(editItems.filter(item => item.id !== idToRemove));
    };

    const handleUpdateRecord = async () => {
        if (!editMainName || editItems.length === 0) {
            alert("Add at least one item.");
            return;
        }

        const MAX_SIZE = 3 * 1024 * 1024;
        const largeFiles = editItems.filter(item => item.file && item.file.size > MAX_SIZE);

        if (largeFiles.length > 0) {
            const largeFileNames = largeFiles.map(item => item.file.name).join(", ");
            alert(`This file(s) are larger than 3MB:\n${largeFileNames}`);
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', editMainName);
            formData.append('uploadName', editUploadNameInput);
            formData.append('date', editDate ? editDate.format('YYYY-MM-DD') : '');

            const itemsData = editItems.map(item => ({
                id: item.id,
                uploadName: item.uploadName,
                originalName: item.originalName,
                isExisting: item.isExisting,
                savedFilename: item.savedFilename,
                path: item.path
            }));

            formData.append('itemsData', JSON.stringify(itemsData));

            editItems.forEach(item => {
                if (!item.isExisting && item.file) {
                    formData.append('files', item.file);
                }
            });

            await axios.put(`${API_URL}/${editRecordId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setEditModalOpen(false);
            fetchTableData();
            alert("Record updated successfully!");
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    return (
        <>
            <Paper elevation={3} sx={{ m: 4 }}>
                <AppBar position="static" sx={{ mb: 4 }}>
                    <Toolbar sx={{ gap: 2 }}>
                        {/* Categories Menu */}
                        <Box onMouseLeave={() => setDashboardAnchor(null)}>
                            <Button id="dashboard-button" color="inherit" onMouseEnter={(e) => setDashboardAnchor(e.currentTarget)}>
                                Categories
                            </Button>
                            <Menu
                                id="dashboard-menu"
                                anchorEl={dashboardAnchor}
                                open={Boolean(dashboardAnchor)}
                                onClose={() => setDashboardAnchor(null)}
                                MenuListProps={{ onMouseEnter: () => setDashboardAnchor(document.getElementById('dashboard-button')), onMouseLeave: () => setDashboardAnchor(null) }}
                            >
                                <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/dashboard'); }}>Categories</MenuItem>
                                <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/subcategories'); }}>Sub Categories</MenuItem>
                                <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/products'); }}>Grouping</MenuItem>
                                <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/dates'); }}>Dates</MenuItem>
                            </Menu>
                        </Box>

                        {/* File Upload Menu */}
                        <Box onMouseLeave={() => setDashboardAnchorFileUpload(null)}>
                            <Button id="dashboardFileUpload-button" color="inherit" onMouseEnter={(e) => setDashboardAnchorFileUpload(e.currentTarget)}>
                                File Upload
                            </Button>
                            <Menu
                                id="fileupload-menu"
                                anchorEl={dashboardAnchorFileUpload}
                                open={Boolean(dashboardAnchorFileUpload)}
                                onClose={() => setDashboardAnchorFileUpload(null)}
                                MenuListProps={{ onMouseEnter: () => setDashboardAnchorFileUpload(document.getElementById('dashboardFileUpload-button')), onMouseLeave: () => setDashboardAnchorFileUpload(null) }}
                            >
                                <MenuItem onClick={() => { setDashboardAnchorFileUpload(null); navigate('/singleFileUpload'); }}>Single File Upload</MenuItem>
                                <MenuItem onClick={() => { setDashboardAnchorFileUpload(null); navigate('/multipleFileUpload'); }}>Multiple File Upload</MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </AppBar>
                <Typography variant="h4" sx={{ mb: 1, ml: 3, fontWeight: 'bold' }}>Multiple File Upload</Typography>

                {/* Main Name Input */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, ml: 8, mb: 6, mt: 5, alignItems: 'center' }}>
                    <TextField sx={{ width: '40%' }} label="Name" variant="outlined" value={name} onChange={(e) => setName(e.target.value)} />

                    {/* Upload Name Dropdown */}
                    <TextField
                        select
                        sx={{ width: '30%' }}
                        label="Upload name"
                        variant="outlined"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                    >
                        <MenuItem value=""></MenuItem>
                        {dropdownItems.map((item, index) => (
                            <MenuItem key={item.itemId || index} value={item.uploadName}>
                                {item.uploadName}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* File Add Section */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, ml: 8, mb: 6, alignItems: 'center' }}>

                    <FirstComponent label="Select Date" value={date} onChange={(e) => setDate(e)} />
                    <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none' }}>
                        {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Upload file'}
                        <VisuallyHiddenInput
                            type="file"
                            multiple
                            onChange={(event) => {
                                if (event.target.files.length > 0) {
                                    setSelectedFiles(Array.from(event.target.files));
                                }
                            }}
                        />
                    </Button>

                    <Fab size="small" color="primary" onClick={handleAddItems}><AddIcon /></Fab>
                    <Button variant="contained" color="primary" onClick={handleUpload}>Submit</Button>
                    <Button variant="contained" color="error" onClick={handleClear}>Clear</Button>
                </Box>

                {/* Items Table */}
                <Box sx={{ mx: 8, width: '40%' }}>
                    <Typography sx={{ p: 1, fontWeight: 'bold' }}>Todo Items</Typography>
                    <TableContainer >
                        <Table >
                            <TableHead >
                                <TableRow>
                                    <TableCell>File</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>No items added yet.</TableCell></TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {editingId === item.id ? (
                                                    <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                                                        {'Upload New file'}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            multiple
                                                            onChange={(e) => {
                                                                if (e.target.files.length > 0) {
                                                                    const selectedFile = e.target.files[0];
                                                                    const maxSizeInBytes = 3 * 1024 * 1024;
                                                                    if (selectedFile.size > maxSizeInBytes) {
                                                                        alert(`The file "${selectedFile.name}" is too large! Maximum allowed size is 3MB.`);
                                                                        e.target.value = null;
                                                                        return;
                                                                    }
                                                                    setEditLocalFile(selectedFile);
                                                                }
                                                            }}
                                                        />
                                                    </Button>
                                                ) : (
                                                    item.file?.name || 'No file'
                                                )}
                                            </TableCell>

                                            <TableCell align="right" width="110px">
                                                {editingId === item.id ? (
                                                    <>
                                                        <IconButton sx={{ mr: 4 }} color="success" size="small" onClick={() => handleEditSave(item.id)}>
                                                            <CheckCircleIcon />
                                                        </IconButton>
                                                        <IconButton color="error" size="small" onClick={handleEditCancel}>
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton color="grey" size="small" onClick={() => handleEditStart(item)}><EditIcon /></IconButton>
                                                        <IconButton color="primary" size="small" onClick={() => handleViewLocalFile(item.file)}><VisibilityIcon /></IconButton>
                                                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(item.id)}><DeleteIcon /></IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>

            {/* --- EDIT DIALOG --- */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Record</DialogTitle>
                <DialogContent sx={{ mt: 1 }}>

                    <Box sx={{ display: 'flex', gap: 3, mb: 4, mt: 2, alignItems: 'center' }}>
                        <TextField sx={{ flex: 1 }} label="Main Name" variant="outlined" value={editMainName} onChange={(e) => setEditMainName(e.target.value)} />
                        <TextField
                            select
                            sx={{ flex: 1 }}
                            label="Upload name"
                            variant="outlined"
                            value={editUploadNameInput}
                            onChange={(e) => setEditUploadNameInput(e.target.value)}
                        >
                            <MenuItem value=""> </MenuItem>
                            {dropdownItems.map((item, index) => (
                                <MenuItem key={item.itemId || index} value={item.uploadName}>
                                    {item.uploadName}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ flex: 1 }}>
                            <FirstComponent
                                label="Select Date"
                                value={editDate}
                                onChange={(e) => setEditDate(e)}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center' }}>
                        {/* CHANGED: Dynamic button text and handles array logic */}
                        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
                            {editSelectedFiles.length > 0 ? `${editSelectedFiles.length} file(s) selected` : 'Upload files'}
                            <VisuallyHiddenInput
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files.length > 0) {
                                        setEditSelectedFiles(Array.from(e.target.files));
                                    }
                                }}
                            />
                        </Button>
                        <Fab size="small" color="primary" onClick={handleModalAddItem}><AddIcon /></Fab>
                    </Box>

                    <TableContainer >
                        <Table size="small" sx={{ '& td, & th': { border: 0 }, width: '100%' }}>
                            <TableHead >
                                <TableRow>
                                    <TableCell><strong>File Info</strong></TableCell>
                                    <TableCell sx={{ width: '150px' }} align="right"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {editItems.length === 0 ? (<TableRow><TableCell colSpan={3} align="center">No items.</TableCell></TableRow>) : (
                                    editItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {modalInlineEditId === item.id ? (
                                                    <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                                                        {modalInlineEditFile ? modalInlineEditFile.name : 'Replace File'}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files.length > 0) {
                                                                    const selectedFile = e.target.files[0];
                                                                    const maxSizeInBytes = 3 * 1024 * 1024;
                                                                    if (selectedFile.size > maxSizeInBytes) {
                                                                        alert(`The file "${selectedFile.name}" is too large! Maximum allowed size is 3MB.`);
                                                                        e.target.value = null;
                                                                        return;
                                                                    }
                                                                    setModalInlineEditFile(selectedFile);
                                                                }
                                                            }}
                                                        />
                                                    </Button>
                                                ) : (
                                                    item.isExisting ? (
                                                        <Typography variant="caption">Current: {item.originalName}</Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="success.main">New: {item.originalName}</Typography>
                                                    )
                                                )}
                                            </TableCell>

                                            <TableCell align="right">
                                                {modalInlineEditId === item.id ? (
                                                    <>
                                                        <IconButton color="success" size="small" onClick={() => {
                                                            setEditItems(editItems.map(i => i.id === item.id ? {
                                                                ...i,
                                                                uploadName: modalInlineEditName.trim(),
                                                                ...(modalInlineEditFile ? {
                                                                    file: modalInlineEditFile,
                                                                    originalName: modalInlineEditFile.name,
                                                                    isExisting: false
                                                                } : {})
                                                            } : i));
                                                            setModalInlineEditId(null);
                                                            setModalInlineEditFile(null);
                                                        }}><CheckCircleIcon /></IconButton>

                                                        <IconButton color="error" size="small" onClick={() => {
                                                            setModalInlineEditId(null);
                                                            setModalInlineEditFile(null);
                                                        }}><CancelIcon /></IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton color="grey" onClick={() => {
                                                            setModalInlineEditId(item.id);
                                                            setModalInlineEditName(item.uploadName);
                                                            setModalInlineEditFile(item.file || null);
                                                        }}><EditIcon /></IconButton>
                                                        <IconButton color="primary" onClick={() => {
                                                            if (item.isExisting) window.open(`http://localhost:5000/mulUploads/${item.savedFilename}`, '_blank');
                                                            else handleViewLocalFile(item.file);
                                                        }}><VisibilityIcon /></IconButton>
                                                        <IconButton color="error" onClick={() => handleModalRemoveItem(item.id)}><DeleteIcon /></IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditModalOpen(false)} color="error" variant="outlined">Cancel</Button>
                    <Button onClick={handleUpdateRecord} color="primary" variant="contained">Update</Button>
                </DialogActions>
            </Dialog>

            {/* --- NEW FILE VIEWER DIALOG WITH NAME AND UPLOAD NAME --- */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => { setViewDialogOpen(false); setViewButton(false); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record Details</DialogTitle>
                <DialogContent dividers>
                    {selectedRecord && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Main Name:</strong> {selectedRecord.name}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Upload Name(s):</strong> {selectedRecord.uploadName}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 'bold' }}>
                        Attached Files:
                    </Typography>

                    <List>
                        {selectedRecord?.files?.length > 0 ? (
                            selectedRecord.files.map((fileObj, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            color="primary"
                                            onClick={() => window.open(`http://localhost:5000/mulUploads/${fileObj.savedFilename}`, '_blank')}
                                            title="View File"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={fileObj.originalName} />
                                </ListItem>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">No files attached.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setViewDialogOpen(false); setViewButton(false); }} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>

            {/* --- Button dialog box -- */}
            <Dialog
                open={viewButton}
                onClose={() => { setViewButton(false) }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>View Attached Files</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 'bold' }}>
                        Attached Files:
                    </Typography>

                    <List>
                        {selectedRecord?.files?.length > 0 ? (
                            selectedRecord.files.map((fileObj, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            color="primary"
                                            onClick={() => window.open(`http://localhost:5000/mulUploads/${fileObj.savedFilename}`, '_blank')}
                                            title="View File"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={fileObj.originalName} />
                                </ListItem>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">No files attached.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setViewDialogOpen(false); setViewButton(false); }} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>

            {/* Render Bottom Table with Server Data */}
            <Stack elevation={3} sx={{ m: 2 }}>
                <MultipleFileUploadTable
                    rows={tableRows}
                    onDelete={handleDeleteRecord}
                    onEditClick={handleEditSavedRecord}
                    onViewRecord={handleViewSavedRecord}
                    onView={handleViewButton}
                />
            </Stack>
        </>
    );
}