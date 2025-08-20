# Inventory Management System - Full-Stack Application

## 🚀 Project Overview

The Inventory Management System is a comprehensive full-stack web application meticulously crafted to provide businesses with a powerful and intuitive platform for inventory control. From tracking product stock and managing supplier relationships to logging sales and analyzing key metrics, this project is built to streamline operations, reduce human error, and support data-driven decision-making. By implementing a modern MERN stack architecture, the platform ensures scalability, responsiveness, and a seamless user experience.

## ✨ Key Features

### User-Facing Dashboard

  * **Product Management:** Complete CRUD (Create, Read, Update, Delete) functionality for all products, with detailed attributes like SKU, category, and price.
  * **Real-time Stock Tracking:** Dynamic dashboard displaying current stock levels with automated low-stock alerts to prevent shortages.
  * **Supplier & Customer Management:** A centralized directory to manage contact information and history for all business partners.
  * **Intuitive Search & Filtering:** Advanced search functionality with multi-level filters to quickly retrieve specific products or transactions.
  * **Responsive UI:** A clean and modern user interface built to provide an optimal experience across all devices, from desktops to mobile phones.

### Backend & API

  * **Secure Authentication:** A robust, token-based authentication system to secure the application and protect sensitive data.
  * **RESTful API:** A well-defined API built on Express.js to handle all data interactions between the frontend and the database, ensuring clear separation of concerns.
  * **Server-Side Validation:** Rigorous data validation on the backend to maintain data integrity and prevent security vulnerabilities.
  * **Efficient Database Schema:** A carefully designed MongoDB schema optimized for quick and efficient data retrieval and storage.

## 📸 Visual Showcase

A picture is worth a thousand words. Below are a few screenshots showcasing the user interface and key functionalities of the application.

### Dashboard Overview

A snapshot of the main dashboard, providing a quick overview of key metrics.
<img width="1038" height="651" alt="Screenshot 2025-07-23 141330" src="https://github.com/user-attachments/assets/d60e2507-59a1-4d06-8bf2-dd4bcf2a5c81" />

### Product List & Management

A view of the product list, demonstrating the clean table layout and management options.
<img width="1038" height="646" alt="Screenshot 2025-07-23 141613" src="https://github.com/user-attachments/assets/d332b37f-0860-4329-94db-1c4ba1fef8ac" />

<img width="1030" height="647" alt="Screenshot 2025-07-28 115252" src="https://github.com/user-attachments/assets/2a3f174b-60fe-436d-a334-3f3d4bbb7ca4" />


### Profile Page 

To set the email address to get low stock alerts and change password.
<img width="1036" height="649" alt="Screenshot 2025-07-23 141820" src="https://github.com/user-attachments/assets/d2509dc6-34b0-43b7-a8fa-a367b58a6b3e" />



## 💻 Technology Stack

### Frontend

  * **React.js:** A powerful JavaScript library for building a dynamic and component-based user interface.
  * **React Router DOM:** For handling client-side routing.
  * **Tailwind CSS:** A utility-first CSS framework for building a fully responsive and customizable design system.
  * **Axios:** A robust, promise-based HTTP client for asynchronous API requests.

### Backend

  * **Node.js:** The JavaScript runtime environment powering the server-side logic.
  * **Express.js:** A minimal and flexible Node.js framework for building a scalable RESTful API.
  * **Mongoose:** An elegant Object Data Modeling (ODM) library for MongoDB, providing schema validation and simplifying database interactions.
  * **bcrypt.js:** A library used for securely hashing and salting passwords before storing them.
  * **JWT (JSON Web Tokens):** For a stateless, secure authentication flow between the server and client.

### Database

  * **MongoDB:** A NoSQL, document-based database for flexible and high-performance data storage.

## ⚙️ How It Works

This application operates on a classic **MERN (MongoDB, Express, React, Node)** stack architecture.

1.  **Frontend:** The user interacts with the React application, which handles all UI rendering, user input, and state management.
2.  **API Communication:** The frontend sends asynchronous HTTP requests (e.g., `GET`, `POST`, `PUT`, `DELETE`) to the backend API via Axios.
3.  **Backend:** The Node.js/Express.js server receives these requests. It processes the logic, authenticates the user, and uses Mongoose to interact with the MongoDB database.
4.  **Database:** MongoDB stores all the application's data—including products, transactions, and user information—in JSON-like documents.
5.  **Response:** The backend sends a JSON response back to the frontend, which then updates the UI in real-time.

This modular design ensures a clear separation of concerns, making the codebase easier to maintain, debug, and scale.

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

  * **Node.js** (v18+)
  * **npm** (comes with Node.js)
  * **MongoDB** (local installation or a cloud service like MongoDB Atlas)
  * **Git**

### Installation Steps

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/SakshiKolhe-3095/Inventory_Management_System.git
    cd Inventory_Management_System
    ```

2.  **Backend Setup:**

    ```sh
    cd server
    npm install
    ```

    Create a `.env` file in the `server` directory and add your MongoDB connection string and a secure JWT secret:

    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=5000
    ```

3.  **Frontend Setup:**

    ```sh
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**

    ```sh
    cd server
    npm start
    ```

    The server will run on `http://localhost:5000`.

2.  **Start the Frontend App:**
    In a new terminal, navigate to the `client` directory:

    ```sh
    cd ../client
    npm start
    ```

    The application will open in your browser at `http://localhost:3000`.

-----

## 🔮 Future Enhancements

  * **Barcode Scanning:** Add functionality to scan barcodes for faster product lookup and transaction processing.
  * **PDF Export:** Allow users to export reports (e.g., sales summaries, stock lists) as PDF documents.
  * **Automated Purchase Orders:** Automate the creation and sending of purchase orders to suppliers when stock levels fall below a set reorder point.
  * **Dashboard Customization:** Allow users to customize their dashboard by rearranging widgets and selecting which key metrics they want to see.
