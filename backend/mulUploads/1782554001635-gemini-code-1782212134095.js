const fetchTableData = async () => {
        try {
            const response = await axios.get(API_URL);
            
            const formattedData = response.data.map(record => ({
                _id: record._id,
                
                // FIX: Look for 'name' first, and if it's empty, look for 'mainName'
                customTitle: record.name || record.mainName || "Unknown Name", 
                
                files: record.items ? record.items.map(item => ({
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