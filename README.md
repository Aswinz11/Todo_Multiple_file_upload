# CRUD Project

## Overview

CRUD Project is a full-stack MERN application developed to manage Categories, Subcategories, and Products efficiently. The application provides a user-friendly interface for performing Create, Read, Update, and Delete (CRUD) operations while storing data in MongoDB.

## Features

* User Login Authentication
* Category Management

  * Add Category
  * View Category
  * Update Category
  * Delete Category
* Subcategory Management

  * Add Subcategory
  * View Subcategory
  * Update Subcategory
  * Delete Subcategory
* Product Management

  * Add Product
  * View Product
  * Update Product
  * Delete Product
* Dynamic Category and Subcategory Mapping
* MongoDB Database Integration
* REST API Implementation
* Responsive User Interface

## Technology Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Tools

* Visual Studio Code
* Git
* GitHub
* Postman

## Project Structure

```text
CRUD2
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── dashboard.js
│   │   ├── subcategory.js
│   │   ├── grouping.js
│   │   ├── login.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Installation and Setup

### Clone Repository

```bash
git clone https://github.com/Aswinz11/CRUD-Project2.git
```

### Navigate to Project Folder

```bash
cd CRUD-Project2
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

## Application Modules

### Login Module

Provides user authentication and redirects users to the dashboard.

### Category Module

Allows users to create, view, update, and delete categories.

### Subcategory Module

Allows users to manage subcategories associated with categories.

### Grouping Module

Displays subcategories dynamically based on the selected category.

### Product Module

Allows users to manage product information and associate products with categories and subcategories.

## Database

MongoDB is used as the database for storing:

* User Information
* Categories
* Subcategories
* Products

## API Operations

### Categories

* GET Categories
* POST Category
* PUT Category
* DELETE Category

### Subcategories

* GET Subcategories
* POST Subcategory
* PUT Subcategory
* DELETE Subcategory

### Products

* GET Products
* POST Product
* PUT Product
* DELETE Product

## Future Enhancements

* JWT Authentication
* Protected Routes
* Role-Based Authorization
* Search Functionality
* Pagination
* File Uploads
* Dashboard Analytics
* Deployment

## GitHub Repository

Repository URL:

https://github.com/Aswinz11/Todo_Multiple_file_upload

## Author

**Aswin G**

MERN Stack Developer
