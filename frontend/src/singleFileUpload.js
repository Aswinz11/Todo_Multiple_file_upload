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

// Custom Components & Utils
import FileUpload from './singleFileUploadTable';
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

const API_URL = 'http://localhost:5000/uploads';

export default function SingleFileUpload() {
    const navigate = useNavigate();

    // Nav State
    const [dashboardAnchor, setDashboardAnchor] = useState(null);
    const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [uploadName, setUploadName] = useState('');
    const [file, setFile] = useState(null);
    const [items, setItems] = useState([]);

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

    // --- NEW EDIT DIALOG STATE ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editRecordId, setEditRecordId] = useState('');
    const [editMainName, setEditMainName] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [editUploadNameInput, setEditUploadNameInput] = useState('');
    const [editFileInput, setEditFileInput] = useState(null);
    const [modalInlineEditId, setModalInlineEditId] = useState(null);
    const [modalInlineEditName, setModalInlineEditName] = useState('');
    const [modalInlineEditFile, setModalInlineEditFile] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchTableData();
    }, []);

    const fetchTableData = async () => {
        try {
            const response = await axios.get(API_URL);

            const formattedData = response.data.map(record => ({
                _id: record._id,
                name: record.mainName || "Unknown Name",
                uploadName: record.items ? record.items.map(item => item.uploadName).join(', ') : 'No name',
                files: record.items ? record.items.map(item => ({
                    uploadName: item.uploadName,
                    originalName: item.originalFileName || item.uploadName,
                    savedFilename: item.savedFileName,
                    path: item.filePath
                })) : []
            }));

            setTableRows(formattedData);
        } catch (error) {
            console.error("Failed to fetch table data:", error);
        }
    };

    // --- Local Form Handlers ---
    const handleAddItems = () => {
        if (!uploadName.trim()) { alert("Please enter a name for the file"); return; }
        if (!file) { alert("Please select a file before adding"); return; }

        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            alert("Please select a PDF, JPG, or PNG.");
            setFile(null);
            return;
        }
        const isDuplicate = items.some(item =>
            item.uploadName.toLowerCase() === uploadName.trim().toLowerCase() ||
            item.file.name === file.name
        );
        if (isDuplicate) {
            alert("This Upload Name or File has already been added to the list.");
            return;
        }
        const newItem = { id: Date.now(), uploadName: uploadName.trim(), file: file };
        setItems([...items, newItem]);
        setUploadName('');
        setFile(null);
    };

    const handleRemoveItem = (idToRemove) => {
        setItems(items.filter(item => item.id !== idToRemove));
    };

    const handleClear = () => {
        setItems([]); setUploadName(''); setName(''); setFile(null);
    };

    const handleViewLocalFile = (file) => {
        if (file) {
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } else {
            alert("No file attached to view.");
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
        const isNameDuplicate = tableRows.some(
            row => row.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (isNameDuplicate) {
            alert("This Name is already taken. Please choose a different name.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('itemsData', JSON.stringify(items.map(item => ({ id: item.id, uploadName: item.uploadName }))));
            items.forEach(item => {
                if (item.file) formData.append('files', item.file);
            });
            await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setItems([]); setName('');
            fetchTableData();
        } catch (err) {
            alert("This Recent uploaded file is larger file than 5MB.");
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

    // --- NEW EDIT DIALOG HANDLERS ---
    const handleEditSavedRecord = (row) => {
        setEditRecordId(row._id);
        setEditMainName(row.name);

        const mappedItems = row.files.map((f, i) => ({
            id: `existing_${i}`,
            uploadName: f.uploadName || f.originalName,
            originalName: f.originalName,
            isExisting: true,
            path: f.path,
            savedFilename: f.savedFilename,
            file: null
        }));

        setEditItems(mappedItems);
        setEditModalOpen(true);
    };

    const handleModalAddItem = () => {
        if (!editUploadNameInput.trim() || !editFileInput) { alert("Please enter a name and select a file."); return; }
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = editFileInput.name.substring(editFileInput.name.lastIndexOf('.')).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            alert("Please select a PDF, JPG, or PNG.");
            setEditFileInput(null);
            return;
        }
        const isDuplicate = editItems.some(item => {
            const nameMatches = item.uploadName.toLowerCase() === editUploadNameInput.trim().toLowerCase();
            const newFileMatches = item.file && item.file.name === editFileInput.name;
            const existingFileMatches = item.originalName === editFileInput.name;

            return nameMatches || newFileMatches || existingFileMatches;
        });

        if (isDuplicate) {
            alert("This Upload Name or File is already in the edit list.");
            return;
        }
        setEditItems([...editItems, {
            id: Date.now(),
            uploadName: editUploadNameInput.trim(),
            file: editFileInput,
            isExisting: false
        }]);
        setEditUploadNameInput(''); setEditFileInput(null);
    };

    const handleModalRemoveItem = (idToRemove) => {
        setEditItems(editItems.filter(item => item.id !== idToRemove));
    };

    const handleUpdateRecord = async () => {
        if (!editMainName || editItems.length === 0) { alert("Provide a main Name and at least one item."); return; }

        // Optional: Add duplicate check for edits as well (ignoring the current record being edited)
        const isEditNameDuplicate = tableRows.some(
            row => row._id !== editRecordId && row.name.toLowerCase() === editMainName.trim().toLowerCase()
        );

        if (isEditNameDuplicate) {
            alert("This Name is already taken by another record.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', editMainName);

            const itemsData = editItems.map(item => ({
                id: item.id,
                uploadName: item.uploadName,
                originalName: item.originalName || item.uploadName,
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

            await axios.put(`${API_URL}/${editRecordId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            setEditModalOpen(false);
            fetchTableData();
        } catch (err) {
            console.error("Update failed:", err);
            alert(`The New File is larger than 5MB.`);
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

                <Typography variant="h4" sx={{ mb: 1, ml: 3, fontWeight: 'bold' }}>Single File Upload</Typography>

                {/* Main Name Input */}
                <TextField sx={{ width: '40%', m: 8, mb: 6 }} label="Name" variant="outlined" value={name} onChange={(e) => setName(e.target.value)} />

                {/* File Add Section */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, ml: 8, mb: 6, alignItems: 'center' }}>
                    <TextField sx={{ width: '30%' }} label="Upload name" variant="outlined" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />

                    <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none' }}>
                        {file ? file.name : 'Upload file'}
                        <VisuallyHiddenInput type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={(event) => { if (event.target.files.length > 0) setFile(event.target.files[0]); }} />
                    </Button>

                    <Fab size="small" color="primary" onClick={handleAddItems}><AddIcon /></Fab>
                    <Button variant="contained" color="primary" onClick={handleUpload}>Submit</Button>
                    <Button variant="contained" color="error" onClick={handleClear}>Clear</Button>
                </Box>

                {/* Items Table */}
                <Box sx={{ mx: 8, width: '60%' }}>

                    <Typography sx={{ p: 2, fontWeight: 'bold' }}>Todo Items</Typography>
                    <TableContainer >
                        <Table >
                            <TableHead >
                                <TableRow>
                                    <TableCell>Upload Name</TableCell>
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
                                                    <TextField size="small" variant="standard" value={editName} onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(item.id); if (e.key === 'Escape') handleEditCancel(); }}
                                                    />
                                                ) : (item.uploadName)}
                                            </TableCell>

                                            {/* --- LOCAL FILE INLINE UPLOAD COMPONENT --- */}
                                            <TableCell>
                                                {editingId === item.id ? (
                                                    <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                                                        {'Upload New file'}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            accept=".pdf, .jpg, .jpeg, .png"
                                                            onChange={(e) => {
                                                                if (e.target.files.length > 0) {
                                                                    const selectedFile = e.target.files[0];
                                                                    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
                                                                    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

                                                                    if (!allowedExtensions.includes(fileExtension)) {
                                                                        alert("Please select a PDF, JPG, or PNG.");
                                                                        e.target.value = null;
                                                                        return;
                                                                    }

                                                                    const maxSizeInBytes = 5 * 1024 * 1024;
                                                                    if (selectedFile.size > maxSizeInBytes) {
                                                                        alert(`The file "${selectedFile.name}" is too large! Maximum allowed size is 5MB.`);
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

                                            <TableCell align="right">
                                                {editingId === item.id ? (
                                                    <>
                                                        <IconButton color="success" size="small" onClick={() => handleEditSave(item.id)}><CheckCircleIcon /></IconButton>
                                                        <IconButton color="error" size="small" onClick={handleEditCancel}><CancelIcon /></IconButton>
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

                    <TextField sx={{ mb: 4, mt: 2, width: '50%' }} label="Main Name" variant="outlined" value={editMainName} onChange={(e) => setEditMainName(e.target.value)} />

                    <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center' }}>
                        <TextField sx={{ width: '50%' }} label="Upload name" variant="outlined" value={editUploadNameInput} onChange={(e) => setEditUploadNameInput(e.target.value)} />
                        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
                            {editFileInput ? editFileInput.name : 'Upload file'}
                            <VisuallyHiddenInput type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={(e) => { if (e.target.files.length > 0) setEditFileInput(e.target.files[0]); }} />
                        </Button>
                        <Fab size="small" color="primary" onClick={handleModalAddItem}><AddIcon /></Fab>
                    </Box>

                    <TableContainer variant="outlined">
                        <Table size="small" sx={{ '& td, & th': { border: 0 }, width: '100%' }}>
                            <TableHead >
                                <TableRow>
                                    <TableCell><strong>Upload Name</strong></TableCell>
                                    <TableCell><strong>File Info</strong></TableCell>
                                    <TableCell align="right"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {editItems.length === 0 ? (<TableRow><TableCell colSpan={3} align="center">No items.</TableCell></TableRow>) : (
                                    editItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {modalInlineEditId === item.id ? (
                                                    <TextField size="small" variant="standard" value={modalInlineEditName} onChange={(e) => setModalInlineEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                setEditItems(editItems.map(i => i.id === item.id ? {
                                                                    ...i,
                                                                    uploadName: modalInlineEditName.trim(),
                                                                    ...(modalInlineEditFile ? { file: modalInlineEditFile, isExisting: false } : {})
                                                                } : i));
                                                                setModalInlineEditId(null);
                                                                setModalInlineEditFile(null);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setModalInlineEditId(null);
                                                                setModalInlineEditFile(null);
                                                            }
                                                        }}
                                                    />
                                                ) : (item.uploadName)}
                                            </TableCell>

                                            {/* --- MODAL DIALOG FILE INLINE UPLOAD COMPONENT --- */}
                                            <TableCell>
                                                {modalInlineEditId === item.id ? (
                                                    <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                                                        {modalInlineEditFile ? modalInlineEditFile.name : 'Replace File'}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            accept=".pdf, .jpg, .jpeg, .png"
                                                            onChange={(e) => {
                                                                if (e.target.files.length > 0) {
                                                                    const selectedFile = e.target.files[0];
                                                                    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
                                                                    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

                                                                    if (!allowedExtensions.includes(fileExtension)) {
                                                                        alert("Please select a PDF, JPG, or PNG.");
                                                                        e.target.value = null;
                                                                        return;
                                                                    }

                                                                    const maxSizeInBytes = 5 * 1024 * 1024;
                                                                    if (selectedFile.size > maxSizeInBytes) {
                                                                        alert(`The file "${selectedFile.name}" is too large! Maximum allowed size is 5MB.`);
                                                                        e.target.value = null;
                                                                        return;
                                                                    }

                                                                    setModalInlineEditFile(selectedFile);
                                                                }
                                                            }}
                                                        />
                                                    </Button>
                                                ) : (
                                                    item.isExisting ? (<Typography variant="caption">Current: {item.originalName || item.savedFilename?.substring(14)}</Typography>)
                                                        : (<Typography variant="caption" color="success.main">New: {item.file?.name}</Typography>)
                                                )}
                                            </TableCell>

                                            <TableCell align="right">
                                                {modalInlineEditId === item.id ? (
                                                    <>
                                                        <IconButton color="success" size="small" onClick={() => {
                                                            setEditItems(editItems.map(i => i.id === item.id ? {
                                                                ...i,
                                                                uploadName: modalInlineEditName.trim(),
                                                                ...(modalInlineEditFile ? { file: modalInlineEditFile, isExisting: false } : {})
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
                                                            if (item.isExisting) window.open(`http://localhost:5000/uploads/${item.savedFilename}`, '_blank');
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
                    <Button onClick={handleUpdateRecord} color="primary" variant="contained">update</Button>
                </DialogActions>
            </Dialog>

            {/* --- NEW FILE VIEWER DIALOG WITH NAME AND UPLOAD NAME --- */}
            <Dialog
                open={viewDialogOpen} // Opens if view icon is clicked
                onClose={() => { setViewDialogOpen(false); setViewButton(false); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record Details</DialogTitle>
                <DialogContent dividers>
                    {/* Display the Record Info */}
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

                    {/* Display the Files List */}
                    <List>
                        {selectedRecord?.files?.length > 0 ? (
                            selectedRecord.files.map((fileObj, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            color="primary"
                                            onClick={() => window.open(`http://localhost:5000/uploads/${fileObj.savedFilename}`, '_blank')}
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
                open={viewButton} // Opens if view button is clicked
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

                                            onClick={() => window.open(`http://localhost:5000/uploads/${fileObj.savedFilename}`, '_blank')}
                                            title="View File"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    }
                                >
                                    {/* LEAVE THIS AS originalName so the UI still looks clean */}
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
            <Paper elevation={3} sx={{ m: 2 }}>
                <FileUpload
                    rows={tableRows}
                    onDelete={handleDeleteRecord}
                    onEditClick={handleEditSavedRecord}
                    onViewRecord={handleViewSavedRecord}
                    onView={handleViewButton}
                />
            </Paper>
        </>
    );
}