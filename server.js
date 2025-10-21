const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'smart_waste',
    port: 3306,
    timezone: 'UTC'
};

// Create database connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database
async function initializeDatabase() {
    try {
        // Create database if it doesn't exist
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            timezone: 'UTC'
        });

        await connection.execute('CREATE DATABASE IF NOT EXISTS smart_waste');
        await connection.execute('USE smart_waste');

        // Create waste_bins table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS waste_bins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location VARCHAR(100) NOT NULL,
                type VARCHAR(30) NOT NULL,
                fill_level INT DEFAULT 0 CHECK (fill_level BETWEEN 0 AND 100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create pickup_logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pickup_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bin_id INT NOT NULL,
                collected_kg DECIMAL(8,2),
                pickup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(bin_id) REFERENCES waste_bins(id) ON DELETE CASCADE
            )
        `);

        await connection.end();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// API Routes

// Get all bins
app.get('/api/bins', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM waste_bins ORDER BY id DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching bins:', error);
        res.status(500).json({ message: 'Failed to fetch bins' });
    }
});

// Add new bin
app.post('/api/bins', async (req, res) => {
    try {
        const { location, type } = req.body;
        
        if (!location || !type) {
            return res.status(400).json({ message: 'Location and type are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO waste_bins (location, type) VALUES (?, ?)',
            [location, type]
        );

        res.json({ 
            message: 'Bin added successfully', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding bin:', error);
        res.status(500).json({ message: 'Failed to add bin' });
    }
});

// Update bin fill level
app.put('/api/bins/:id/fill', async (req, res) => {
    try {
        const binId = req.params.id;
        const { fillLevel } = req.body;

        if (fillLevel < 0 || fillLevel > 100) {
            return res.status(400).json({ message: 'Fill level must be between 0 and 100' });
        }

        const [result] = await pool.execute(
            'UPDATE waste_bins SET fill_level = ? WHERE id = ?',
            [fillLevel, binId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        res.json({ message: 'Fill level updated successfully' });
    } catch (error) {
        console.error('Error updating fill level:', error);
        res.status(500).json({ message: 'Failed to update fill level' });
    }
});

// Record pickup
app.post('/api/bins/:id/pickup', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const binId = req.params.id;
        const { collectedWeight } = req.body;

        if (collectedWeight < 0) {
            return res.status(400).json({ message: 'Weight must be a positive number' });
        }

        // Insert pickup log
        await connection.execute(
            'INSERT INTO pickup_logs (bin_id, collected_kg) VALUES (?, ?)',
            [binId, collectedWeight]
        );

        // Reset bin fill level
        const [result] = await connection.execute(
            'UPDATE waste_bins SET fill_level = 0 WHERE id = ?',
            [binId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Bin not found' });
        }

        await connection.commit();
        res.json({ message: 'Pickup recorded and bin reset successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording pickup:', error);
        res.status(500).json({ message: 'Failed to record pickup' });
    } finally {
        connection.release();
    }
});

// Get pickup logs
app.get('/api/pickups', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT pl.*, wb.location, wb.type 
            FROM pickup_logs pl 
            JOIN waste_bins wb ON pl.bin_id = wb.id 
            ORDER BY pl.pickup_time DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pickup logs:', error);
        res.status(500).json({ message: 'Failed to fetch pickup logs' });
    }
});

// Get bin statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [totalBins] = await pool.execute('SELECT COUNT(*) as count FROM waste_bins');
        const [fullBins] = await pool.execute('SELECT COUNT(*) as count FROM waste_bins WHERE fill_level >= 75');
        const [emptyBins] = await pool.execute('SELECT COUNT(*) as count FROM waste_bins WHERE fill_level = 0');
        const [totalPickups] = await pool.execute('SELECT COUNT(*) as count FROM pickup_logs');
        const [totalWeight] = await pool.execute('SELECT SUM(collected_kg) as total FROM pickup_logs');

        res.json({
            totalBins: totalBins[0].count,
            fullBins: fullBins[0].count,
            emptyBins: emptyBins[0].count,
            totalPickups: totalPickups[0].count,
            totalWeightCollected: totalWeight[0].total || 0
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

// Delete bin
app.delete('/api/bins/:id', async (req, res) => {
    try {
        const binId = req.params.id;
        
        const [result] = await pool.execute(
            'DELETE FROM waste_bins WHERE id = ?',
            [binId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        res.json({ message: 'Bin deleted successfully' });
    } catch (error) {
        console.error('Error deleting bin:', error);
        res.status(500).json({ message: 'Failed to delete bin' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Smart Waste Management System is ready!');
    });
}

startServer().catch(console.error);
