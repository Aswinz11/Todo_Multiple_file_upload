import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";
import Dashboard from "./category";
import SubCategory from './subcategory';
import GroupingCRUD from './grouping';
import Dates from './todoDate';
import SingleFileUpload from './singleFileUpload';
import MultipleFileUpload from './multipleFileUpload';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subcategories" element={<SubCategory />} />
        <Route path="/products" element={<GroupingCRUD />} />
        <Route path="/dates" element={<Dates />} />
        <Route path="/singleFileUpload" element={<SingleFileUpload />} />
        <Route path="/multipleFileUpload" element={<MultipleFileUpload />} />
        
        

      </Routes>
    </Router>
  );
}

export default App;