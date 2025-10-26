# Smart Waste Management System

A modern web-based waste management system that allows you to monitor and manage waste bins efficiently. This application provides real-time monitoring, pickup scheduling, and comprehensive reporting features.

## Features

- 🗑️ **Bin Management**: Add, update, and monitor waste bins
- 📊 **Real-time Monitoring**: Track fill levels with visual indicators
- 🚛 **Pickup Management**: Record pickups and automatically reset bins
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- 📈 **Statistics**: View comprehensive waste collection statistics

## Screenshots

The application features:
- Interactive table with fill level indicators
- Modal dialogs for adding bins and recording pickups
- Real-time status updates
- Responsive design for all devices

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 14 or higher)
- **MySQL** (version 5.7 or higher)
- **npm** (comes with Node.js)

## Installation

1. **Clone or download the project files**
   ```bash
   # If you have git
   git clone <repository-url>
   cd smart-waste-management
   
   # Or simply download and extract the files
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   - Make sure MySQL is running on your system
   - Update the database credentials in `server.js` if needed:
     ```javascript
     const dbConfig = {
         host: 'localhost',
         user: 'root',
         password: 'your_password',  // Change this
         database: 'smart_waste',
         port: 3306,
         timezone: 'UTC'
     };
     ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Configuration

### Database Configuration

The application will automatically create the required database and tables on first run. If you need to modify the database settings, edit the `dbConfig` object in `server.js`.

### Default Database Settings
- **Host**: localhost
- **Port**: 3306
- **Database**: smart_waste
- **User**: root
- **Password**: password (change this!)

## Usage

### Adding a New Bin
1. Click the "Add Bin" button
2. Enter the location and select waste type
3. Click "Add Bin" to save

### Updating Fill Level
1. Select a bin from the table
2. Click "Update Fill Level" button
3. Enter the new fill percentage (0-100)
4. Click "Update Fill Level"

### Recording a Pickup
1. Select a bin from the table
2. Click "Record Pickup" button
3. Enter the collected weight in kg
4. Click "Record Pickup"

The system will automatically reset the bin's fill level to 0% after recording a pickup.

## API Endpoints

The application provides a REST API for programmatic access:

- `GET /api/bins` - Get all bins
- `POST /api/bins` - Add a new bin
- `PUT /api/bins/:id/fill` - Update bin fill level
- `POST /api/bins/:id/pickup` - Record pickup
- `GET /api/pickups` - Get pickup logs
- `GET /api/stats` - Get system statistics
- `DELETE /api/bins/:id` - Delete a bin

## Development

To run the application in development mode with auto-restart:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

## File Structure

```
smart-waste-management/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Node.js backend server
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check database credentials in `server.js`
   - Verify MySQL user has proper permissions

2. **Port Already in Use**
   - Change the PORT in `server.js` or set environment variable
   - Kill any process using port 3000

3. **CORS Issues**
   - The application includes CORS middleware
   - If issues persist, check browser console for errors

### Database Issues

If you encounter database issues:

1. **Reset Database**
   ```sql
   DROP DATABASE IF EXISTS smart_waste;
   ```
   Then restart the application to recreate tables.

2. **Check MySQL Service**
   ```bash
   # Windows
   net start mysql
   
   # Linux/Mac
   sudo service mysql start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

## Future Enhancements

Planned features:
- User authentication and authorization
- Email notifications for full bins
- Mobile app integration
- Advanced analytics and reporting
- GPS location tracking
- Integration with IoT sensors

---

**Happy Waste Managing! 💚🌱♻️**

