import React, { useState, useEffect } from 'react';
import {
    Button, Box, AppBar, Toolbar, TextField, Table, TableBody, TableCell,
    TableContainer, Menu, TableHead, TableRow, Paper, IconButton, Typography,
    MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
    DialogContent, DialogActions, Divider, Fab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import FirstComponent from './todoDatepickerCom';
import dayjs from 'dayjs';

const API_SUB_URL = 'http://localhost:5000/subcategories';
const API_CAT_URL = 'http://localhost:5000/categories';
const API_DATE_URL = 'http://localhost:5000/dates';

export default function Dates() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [todolist, setTodolist] = useState([]);
    const [todoName, setTodoName] = useState('');

    // Creation States (Top Form Fields)
    const [selectedCatId, setSelectedCatId] = useState('');
    const [selectedSubId, setSelectedSubId] = useState('');

    // Local Staging List Inline Editing States
    const [editingLocalId, setEditingLocalId] = useState(null);
    const [inlineCatId, setInlineCatId] = useState('');
    const [inlineSubId, setInlineSubId] = useState('');
    const [inlineDate, setInlineDate] = useState(null);

    // Dialog Master Toggle States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState(null);

    // --- Master States managed within the Edit Dialog Component ---
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [dialogItems, setDialogItems] = useState([]); // holds array items inside open dialog

    // Dialog Input Form Rows (Add dynamic item block within modal)
    const [dlgCatId, setDlgCatId] = useState('');
    const [dlgSubId, setDlgSubId] = useState('');
    const [dlgDate, setDlgDate] = useState(null);

    // Inner Editing Rows inside Edit Dialog collection table
    const [editingRowId, setEditingRowId] = useState(null);
    const [dialogInlineCatId, setDialogInlineCatId] = useState('');
    const [dialogInlineSubId, setDialogInlineSubId] = useState('');
    const [dialogInlineDate, setDialogInlineDate] = useState(null);


    const [dashboardAnchor, setDashboardAnchor] = useState(null);
    const [dashboardAnchorFileUpload, setDashboardAnchorFileUpload] = useState(null);

    // 1. Fetch data on component mount
    const fetchAllData = () => {
        fetch(API_CAT_URL).then(res => res.json()).then(data => setCategories(Array.isArray(data) ? data : []));
        fetch(API_SUB_URL).then(res => res.json()).then(data => setAllSubCategories(Array.isArray(data) ? data : []));
        fetch(API_DATE_URL).then(res => res.json()).then(data => setDates(Array.isArray(data) ? data : []));
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // 2. Open Read-Only View Dialog
    const openViewDialog = (rowGroup) => {
        setViewingItem({
            name: rowGroup.todoName,
            category: rowGroup.categoryNames.join(', '),
            subcategory: rowGroup.subCategoryNames.join(', '),
            date: rowGroup.dates.join(', ')
        });
        setIsViewDialogOpen(true);
    };
    const closeViewDialog = () => {
        setIsViewDialogOpen(false);
        setViewingItem(null);
    };

    // 3. Open Edit Dialog Modal
    const openEditDialog = (rawDoc) => {
        setEditingId(rawDoc._id || rawDoc.id);
        setEditName(rawDoc.todoName || '');
        setDialogItems(rawDoc.items || []);

        // Reset 
        setDlgCatId('');
        setDlgSubId('');
        setDlgDate(null);
        setEditingRowId(null);
        setIsDialogOpen(true);
    };

    const closeEditDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setEditName('');
        setDialogItems([]);
    };

    const handleUpdateDialog = async () => {
        if (!editName.trim() || dialogItems.length === 0) return;
        const isDuplicate = dates.some(doc => {
            const docId = doc._id || doc.id;
            const matchesName = doc.todoName?.trim().toLowerCase() === editName.trim().toLowerCase();
            const isDifferentDocument = docId !== editingId;

            return matchesName && isDifferentDocument;
        });

        if (isDuplicate) {
            alert(`The name "${editName.trim()}" is already taken`);
            return;
        }
        try {
            const payload = {
                todoName: editName.trim(),
                items: dialogItems.map(item => ({
                    subCategoryId: item.subCategory?._id || item.subCategory,
                    date: item.date
                }))
            };
            const response = await fetch(`${API_DATE_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchAllData();
                closeEditDialog();
            }
        } catch (err) {
            console.error("Error updating record details:", err);
        }
    };

    // Deletes row
    const handleDeleteGroup = async (documentId) => {
        try {
            const response = await fetch(`${API_DATE_URL}/${documentId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchAllData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper cascade lists triggers 
    const filteredSubCategories = allSubCategories.filter(sub => {
        const parentId = sub.category?._id || sub.category?.id;
        return parentId === selectedCatId;
    });

    const getInlineSubCategories = (catId) => {
        return allSubCategories.filter(sub => {
            const parentId = sub.category?._id || sub.category?.id;
            return parentId === catId;
        });
    };

    // --- Local Staging Table Inline Action Triggers ---
    const startInlineEdit = (item) => {
        setEditingLocalId(item.localId);
        const currentSub = allSubCategories.find(s => (s.id || s._id) === item.subCategoryId);
        setInlineCatId(currentSub?.category?._id || currentSub?.category?.id || '');
        setInlineSubId(item.subCategoryId);
        setInlineDate(item.date ? dayjs(item.date) : null);
    };

    const saveTodoInlineEdit = (localId) => {
        if (!inlineSubId) return;

        const isDuplicate = todolist.some(item => {
            if (item.localId === localId) return false;

            const itemDate = new Date(item.date).toLocaleDateString();
            const editedDate = inlineDate ? (typeof inlineDate.toDate === 'function' ? inlineDate.toDate() : new Date(inlineDate)).toLocaleDateString() : new Date(item.date).toLocaleDateString();

            return item.subCategoryId === inlineSubId && itemDate === editedDate;
        });

        if (isDuplicate) {
            alert("Duplicate Values");
            return;
        }

        const mainCatName = categories.find(c => (c.id || c._id) === inlineCatId)?.name || "";
        const subCatName = allSubCategories.find(s => (s.id || s._id) === inlineSubId)?.name || "";

        setTodolist(todolist.map(item => {
            if (item.localId === localId) {
                return {
                    ...item,
                    subCategoryId: inlineSubId,
                    subCategoryName: subCatName,
                    categoryName: mainCatName,
                    date: inlineDate ? (typeof inlineDate.toDate === 'function' ? inlineDate.toDate() : new Date(inlineDate)) : item.date
                };
            }
            return item;
        }));
        cancelInlineEdit();
    };

    const cancelInlineEdit = () => {
        setEditingLocalId(null);
        setInlineCatId('');
        setInlineSubId('');
        setInlineDate(null);
    };

    // add todo items
    const handleAddListItem = () => {
        if (!selectedSubId) return;

        // duplicate check
        const isDuplicate = todolist.some(item => {
            const itemDate = new Date(item.date).toLocaleDateString();
            const chosenDate = selectedDate ? (typeof selectedDate.toDate === 'function' ? selectedDate.toDate() : new Date(selectedDate)).toLocaleDateString() : new Date().toLocaleDateString();

            return item.subCategoryId === selectedSubId && itemDate === chosenDate;
        });

        if (isDuplicate) {
            alert("This is duplicate value");
            return;
        }

        const mainCatName = categories.find(c => (c.id || c._id) === selectedCatId)?.name || "";
        const subCatName = allSubCategories.find(s => (s.id || s._id) === selectedSubId)?.name || "";

        const newStagedItem = {
            localId: Date.now(),
            date: selectedDate ? (typeof selectedDate.toDate === 'function' ? selectedDate.toDate() : new Date(selectedDate)) : new Date(),
            subCategoryId: selectedSubId,
            subCategoryName: subCatName,
            categoryName: mainCatName
        };

        setTodolist([...todolist, newStagedItem]);
        setSelectedCatId('');
        setSelectedSubId('');
        setSelectedDate(null);
    };

    const handleClearlist = () => {
        setSelectedCatId('');
        setSelectedSubId('');
        setSelectedDate(null);
        setTodolist([]);
        setTodoName('');
        cancelInlineEdit();
    };

    const handleBulkSubmit = async () => {
        if (todolist.length === 0 || !todoName.trim()) {
            alert("Atleast add one Todo Item");
            return;
        }
        // NEW: Check if the name already exists in your main database state array ('dates')
        const nameExists = dates.some(doc =>
            doc.todoName?.trim().toLowerCase() === todoName.trim().toLowerCase()
        );
        if (nameExists) {
            alert(`The name "${todoName.trim()}" already exists in your records!`);
            return;
        }
        try {
            const payload = {
                todoName: todoName.trim(),
                items: todolist.map(item => ({
                    subCategoryId: item.subCategoryId,
                    date: item.date
                }))
            };

            const response = await fetch(API_DATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchAllData();
                setTodolist([]);
                setTodoName('');
            }
        } catch (err) {
            console.error("Error during submission:", err);
        }
    };
    // --- Dialog Dynamic Action Modifiers ---
    const handleAddItemToDialog = () => {
        if (!dlgCatId || !dlgSubId || !dlgDate) {
            alert("Select a Category,Subcategory and Date");
            return;
        }
        // Check if the combination exists in the modal state list
        const isDuplicate = dialogItems.some(item => {
            const itemSubId = item.subCategory?._id || item.subCategory;
            const itemDate = new Date(item.date).toLocaleDateString();
            const chosenDate = dlgDate ? (typeof dlgDate.toDate === 'function' ? dlgDate.toDate() : new Date(dlgDate)).toLocaleDateString() : new Date().toLocaleDateString();

            return itemSubId === dlgSubId && itemDate === chosenDate;
        });

        if (isDuplicate) {
            alert("This item already exists");
            return;
        }
        const newItem = {
            _id: 'new_temp_' + Date.now(),
            subCategory: allSubCategories.find(s => (s._id || s.id) === dlgSubId),
            date: dlgDate ? (typeof dlgDate.toDate === 'function' ? dlgDate.toDate() : new Date(dlgDate)) : new Date()
        };
        setDialogItems([...dialogItems, newItem]);
        setDlgCatId('');
        setDlgSubId('');
        setDlgDate(null);
    };
    const startDialogInlineEdit = (item) => {
        const targetId = item._id || item.id;
        setEditingRowId(targetId);
        const targetSubId = item.subCategory?._id || item.subCategory || '';
        const currentSub = allSubCategories.find(s => (s.id || s._id) === targetSubId);

        setDialogInlineCatId(currentSub?.category?._id || currentSub?.category?.id || '');
        setDialogInlineSubId(targetSubId);
        setDialogInlineDate(item.date ? dayjs(item.date) : null);
    };

    const saveDialogInlineEdit = (rowId) => {
        // Check for duplicates 
        const isDuplicate = dialogItems.some(item => {
            const itemId = item._id || item.id;
            if (itemId === rowId) return false;
            const itemSubId = item.subCategory?._id || item.subCategory;
            const itemDate = new Date(item.date).toLocaleDateString();
            const editedDate = dialogInlineDate ? (typeof dialogInlineDate.toDate === 'function' ? dialogInlineDate.toDate() : new Date(dialogInlineDate)).toLocaleDateString() : new Date(item.date).toLocaleDateString();

            return itemSubId === dialogInlineSubId && itemDate === editedDate;
        });

        if (isDuplicate) {
            alert("Duplicate items found");
            return;
        }

        setDialogItems(dialogItems.map(item => {
            const itemId = item._id || item.id;
            if (itemId === rowId) {
                return {
                    ...item,
                    subCategory: allSubCategories.find(s => (s._id || s.id) === dialogInlineSubId),
                    date: dialogInlineDate ? (typeof dialogInlineDate.toDate === 'function' ? dialogInlineDate.toDate() : new Date(dialogInlineDate)) : item.date
                };
            }
            return item;
        }));
        setEditingRowId(null);
    };

    // Parse array data elements inline safely
    const getGroupedDatabaseRows = () => {
        if (!Array.isArray(dates)) return [];

        return dates.map(doc => {
            const categoryNames = [];
            const subCategoryNames = [];
            const dateStrings = [];

            if (Array.isArray(doc.items)) {
                doc.items.forEach(item => {
                    const subObj = item.subCategory;
                    categoryNames.push(subObj?.category?.name || "Unassigned");
                    subCategoryNames.push(subObj?.name || "Unassigned");
                    dateStrings.push(item.date ? new Date(item.date).toLocaleDateString() : "No Date");
                });
            }

            return {
                id: doc._id || doc.id,
                todoName: doc.todoName || "Unassigned",
                categoryNames,
                subCategoryNames,
                dates: dateStrings,
                rawDoc: doc
            };
        });
    };

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
                            <MenuItem onClick={() => { setDashboardAnchor(null); navigate('/products'); }}>
                                Grouping
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

            <Typography variant="h4" sx={{ mb: 5 }}> Dates</Typography>

            {/* FORM FIELDS */}
            <Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 5, alignItems: 'center' }}>
                    <TextField
                        label="Name" variant="outlined" size="large" sx={{ width: '40%' }}
                        value={todoName} onChange={(e) => setTodoName(e.target.value)}
                    />
                    <FormControl size="large" sx={{ width: '25%' }}>
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

                    <FormControl size="large" sx={{ width: '25%' }} disabled={!selectedCatId} >
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
                    <FormControl size="large" sx={{ width: '25%' }} disabled={!selectedSubId}>
                        <FirstComponent value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} disabled={!selectedSubId} />
                    </FormControl>

                    <Fab color="primary" aria-label="add" onClick={handleAddListItem} disabled={!selectedSubId}>
                        <AddIcon />
                    </Fab>
                    <Button variant="contained" color="primary" onClick={handleBulkSubmit}>
                        SUBMIT
                    </Button>
                    <Button variant="contained" color="error" onClick={handleClearlist}>
                        Clear
                    </Button>
                </Box>
            </Box>

            {/* STAGED TODO ITEMS GRID VIEW */}
            {todolist.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 4, backgroundColor: '#fafafa', width: '70%' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        TODO ITEMS ({todolist.length})
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 2.5fr 2.5fr 1.5fr', gap: 2, borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Main Category</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Subcategory</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Dates</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', textAlign: 'right' }}>Actions</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {todolist.map(item => {
                            const isBeingEdited = editingLocalId === item.localId;
                            return (
                                <Box key={item.localId} sx={{ display: 'grid', gridTemplateColumns: '2.5fr 2.5fr 2.5fr 1.5fr', gap: 2, alignItems: 'center', py: 0.5 }}>
                                    {isBeingEdited ? (
                                        <>
                                            <FormControl size="small">
                                                <Select value={inlineCatId} onChange={(e) => { setInlineCatId(e.target.value); setInlineSubId(''); }}>
                                                    {categories.map((cat) => (
                                                        <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <FormControl size="small" disabled={!inlineCatId}>
                                                <Select value={inlineSubId} onChange={(e) => setInlineSubId(e.target.value)}>
                                                    {getInlineSubCategories(inlineCatId).map((sub) => (
                                                        <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <FormControl size="small">
                                                <FirstComponent value={inlineDate} onChange={(newDate) => setInlineDate(newDate)} />
                                            </FormControl>
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2">{item.categoryName || '—'}</Typography>
                                            <Typography variant="body2">{item.subCategoryName || '—'}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{new Date(item.date).toLocaleDateString()}</Typography>
                                        </>
                                    )}
                                    <Box sx={{ textAlign: 'right' }}>
                                        {isBeingEdited ? (
                                            <>
                                                <IconButton size="small" color="success" onClick={() => saveTodoInlineEdit(item.localId)}><CheckCircleIcon /></IconButton>
                                                <IconButton size="small" color="error" onClick={cancelInlineEdit}><CancelIcon /></IconButton>
                                            </>
                                        ) : (
                                            <>
                                                <IconButton size="small" color="primary" onClick={() => startInlineEdit(item)} sx={{ mr: 1 }}><EditIcon /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => setTodolist(todolist.filter(i => i.localId !== item.localId))}><DeleteIcon /></IconButton>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* MAIN DATABASE TABLE */}
            <Typography variant="h5" sx={{ mb: 2 }}>Grouped with Data </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Main Category</strong></TableCell>
                            <TableCell><strong>Sub Category</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell align="right"><strong>Action</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getGroupedDatabaseRows().map((rowGroup, index) => {
                            return (
                                <TableRow key={rowGroup.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell style={{ fontWeight: 500 }}>{rowGroup.todoName}</TableCell>

                                    {/* Outputs collections directly inline separated with commas */}
                                    <TableCell>{rowGroup.categoryNames.join(', ')}</TableCell>
                                    <TableCell style={{ fontWeight: 500 }}>{rowGroup.subCategoryNames.join(', ')}</TableCell>
                                    <TableCell>{rowGroup.dates.join(', ')}</TableCell>

                                    <TableCell align="right">
                                        <IconButton color="default" onClick={() => openViewDialog(rowGroup)} sx={{ mr: 1 }}><VisibilityIcon /></IconButton>
                                        <IconButton color="primary" onClick={() => openEditDialog(rowGroup.rawDoc)} sx={{ mr: 1 }}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteGroup(rowGroup.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {getGroupedDatabaseRows().length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No records found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Read-Only View Popup */}
            <Dialog open={isViewDialogOpen} onClose={closeViewDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Record Details</DialogTitle>
                <Divider />
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3, backgroundColor: '#fdfdfd' }}>
                    <Typography variant="body1"><strong>Name:</strong> {viewingItem?.name}</Typography>
                    <Typography variant="body1"><strong>Main Category:</strong> {viewingItem?.category}</Typography>
                    <Typography variant="body1"><strong>Sub Category:</strong> {viewingItem?.subcategory}</Typography>
                    <Typography variant="body1"><strong>Date:</strong> {viewingItem?.date}</Typography>
                </DialogContent>
                <DialogActions><Button onClick={closeViewDialog} color="primary" variant="contained">Close</Button></DialogActions>
            </Dialog>

            {/* MASTER EDIT DIALOG (With internal add, edit and delete list row processing handlers) */}
            <Dialog open={isDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Records</DialogTitle>
                <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth label="Todo Name" variant="outlined" sx={{ mt: 1 }}
                        value={editName} onChange={(e) => setEditName(e.target.value)}
                    />
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                            <Select value={dlgCatId} displayEmpty onChange={(e) => { setDlgCatId(e.target.value); setDlgSubId(''); }}>
                                <MenuItem value="" disabled>Select Category</MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }} disabled={!dlgCatId}>
                            <Select value={dlgSubId} displayEmpty onChange={(e) => setDlgSubId(e.target.value)}>
                                <MenuItem value="" disabled>Select Subcategory</MenuItem>
                                {getInlineSubCategories(dlgCatId).map((sub) => (
                                    <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ flex: 1 }} disabled={!dlgCatId}>
                            <FirstComponent value={dlgDate} onChange={(newDate) => setDlgDate(newDate)} />
                        </FormControl>
                        <Fab size="small" color="primary" onClick={handleAddItemToDialog} >
                            <AddIcon />
                        </Fab>
                    </Box>

                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fcfcfc' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#666' }}>
                            Total Items ({dialogItems.length})
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 3fr 3fr 2fr', gap: 2, borderBottom: '2px solid #ddd', pb: 1, mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>CATEGORY</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>SUB-CATEGORY</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>DATE</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'right' }}>ACTIONS</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {dialogItems.map((item) => {
                                const itemId = item._id || item.id;
                                const isRowEditing = editingRowId === itemId;
                                return (
                                    <Box key={itemId} sx={{ display: 'grid', gridTemplateColumns: '3fr 3fr 3fr 2fr', gap: 2, alignItems: 'center' }}>
                                        {isRowEditing ? (
                                            <>
                                                <FormControl size="small">
                                                    <Select value={dialogInlineCatId} onChange={(e) => { setDialogInlineCatId(e.target.value); setDialogInlineSubId(''); }}>
                                                        {categories.map((cat) => (
                                                            <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <FormControl size="small" disabled={!dialogInlineCatId}>
                                                    <Select value={dialogInlineSubId} onChange={(e) => setDialogInlineSubId(e.target.value)}>
                                                        {getInlineSubCategories(dialogInlineCatId).map((sub) => (
                                                            <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <FormControl size="small">
                                                    <FirstComponent value={dialogInlineDate} onChange={(newDate) => setDialogInlineDate(newDate)} />
                                                </FormControl>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <IconButton size="small" color="success" onClick={() => saveDialogInlineEdit(itemId)}><CheckCircleIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setEditingRowId(null)}><CancelIcon /></IconButton>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Typography variant="body2">{item.subCategory?.category?.name || 'Unassigned'}</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.subCategory?.name || 'Unassigned'}</Typography>
                                                <Typography variant="body2">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</Typography>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <IconButton size="small" color="primary" onClick={() => startDialogInlineEdit(item)}><EditIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setDialogItems(dialogItems.filter(i => (i._id || i.id) !== itemId))}><DeleteIcon /></IconButton>
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                );
                            })}
                            {dialogItems.length === 0 && (
                                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                                    No items found.
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={closeEditDialog} color="inherit">Cancel</Button>
                    <Button onClick={handleUpdateDialog} color="primary" variant="contained" disabled={dialogItems.length === 0 || !editName.trim()}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}