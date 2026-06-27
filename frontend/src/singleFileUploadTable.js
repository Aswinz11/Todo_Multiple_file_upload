import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Button, Paper, InputBase, Typography } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FileUpload({ rows = [], onDelete, onEditClick, onViewRecord, onView }) {
    const [searchText, setSearchText] = useState('');

    const filteredRows = rows.filter((row) =>
        row.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            field: 'sno',
            headerName: 'SNo',
            width: 70,
            sortable: true,
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'name', 
            headerName: 'Name',
            flex: 1,
            minWidth: 120,
        },
           {
            field: 'uploadName',
            headerName: 'Upload Name',
            flex: 1,
            minWidth: 120,
        },
        {
            field: 'files', 
            headerName: 'Uploaded Files',
            flex: 2,
            minWidth: 180,
            renderCell: (params) => {
                const filesList = params.value;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {Array.isArray(filesList) && filesList.length > 0
                                ? filesList.map((f) => f.originalName).join(', ')
                                : 'No files'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'fileViews',
            headerName: 'File View',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Button variant="contained" size="small" onClick={() => onView(params.row)}>
                        VIEW
                    </Button>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Action',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', height: '100%' }}>
                    <IconButton size="small" sx={{ color: '#1976d2' }} onClick={() => onEditClick(params.row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => onDelete(params.row._id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#0288d1' }} onClick={() => onViewRecord(params.row)}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        }
    ];

    return (
        <Paper elevation={5} sx={{ mx: 2, p: 2 }}>
            <Box sx={{ mb: 10, height: 'auto', width: '100%', '& .MuiDataGrid-root': { border: '1px solid #e0e0e0' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'end', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #969494', borderRadius: '4px', px: 1, width: '250px' }}>
                        <IconButton type="button" sx={{ p: '12px' }} aria-label="search">
                            <SearchIcon />
                        </IconButton>
                        <InputBase
                            sx={{ ml: 1, flex: 1, fontSize: '1rem' }}
                            placeholder="Type to search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Box>
                </Box>
                <DataGrid
                    rows={filteredRows || []}
                    columns={columns}
                    getRowId={(row) => row._id}
                    disableRowSelectionOnClick
                    initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                    pageSizeOptions={[1, 5, 10, 25]}
                    rowHeight={60}
                />
            </Box>
        </Paper>
    );
}