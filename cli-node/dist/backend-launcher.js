"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendLauncher = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const axios_1 = __importDefault(require("axios"));
const ora_1 = __importDefault(require("ora"));
class BackendLauncher {
    constructor() {
        this.backendProcess = null;
        this.backendUrl = 'http://localhost:8000';
        this.maxStartupWaitMs = 30000; // 30 seconds
    }
    async ensureBackendRunning() {
        // First check if backend is already running
        if (await this.isBackendRunning()) {
            return true;
        }
        // Try to start the backend
        return await this.startBackend();
    }
    async isBackendRunning() {
        try {
            const response = await axios_1.default.get(`${this.backendUrl}/health`, {
                timeout: 2000
            });
            return response.status === 200;
        }
        catch {
            return false;
        }
    }
    async isPortInUse(port) {
        try {
            const { spawn } = require('child_process');
            const process = spawn('lsof', ['-i', `:${port}`], {
                stdio: 'pipe'
            });
            const result = await new Promise((resolve) => {
                process.on('close', (code) => resolve(code === 0));
                process.on('error', () => resolve(false));
            });
            return result;
        }
        catch {
            return false;
        }
    }
    async startBackend() {
        // Check if port is already in use by another backend
        if (await this.isPortInUse(8000)) {
            console.log('Backend already running on port 8000, connecting to existing instance...');
            // Wait a moment for the existing backend to fully initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await this.isBackendRunning();
        }
        const spinner = (0, ora_1.default)('Starting Redpill backend...').start();
        try {
            // Find the backend directory
            const cliDir = __dirname;
            const projectRoot = this.findProjectRoot(cliDir);
            if (!projectRoot) {
                spinner.fail('Could not find Redpill project root directory');
                return false;
            }
            const backendDir = (0, path_1.join)(projectRoot, 'backend');
            if (!(0, fs_1.existsSync)(backendDir)) {
                spinner.fail('Backend directory not found. Please run from Redpill project directory.');
                return false;
            }
            // Check for Python and dependencies
            const pythonCmd = await this.findPythonCommand(backendDir);
            if (!pythonCmd) {
                spinner.fail('Python not found. Please install Python 3.9+ and backend dependencies.');
                return false;
            }
            spinner.text = 'Launching backend server...';
            // Determine database connection strategy
            const dbUrl = await this.getDatabaseUrl(backendDir);
            const env = {
                ...process.env,
                DATABASE_URL: dbUrl,
                REDIS_URL: 'redis://localhost:6379'
            };
            console.log(`Using database: ${dbUrl.includes('sqlite') ? 'SQLite' : 'PostgreSQL'}`);
            if (dbUrl.includes('sqlite')) {
                console.log('Note: Using isolated CLI database. Use main web interface for full data.');
            }
            this.backendProcess = (0, child_process_1.spawn)(pythonCmd, [
                '-m', 'uvicorn', 'app.main:app',
                '--host', '0.0.0.0',
                '--port', '8000',
                '--log-level', 'warning' // Reduce noise
            ], {
                cwd: backendDir,
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                env
            });
            // Handle process events and capture output for debugging
            this.backendProcess.on('error', (error) => {
                spinner.fail(`Failed to start backend: ${error.message}`);
                console.log('Process error details:', error);
            });
            // Capture stdout/stderr for debugging
            if (this.backendProcess.stdout) {
                this.backendProcess.stdout.on('data', (data) => {
                    console.log('Backend stdout:', data.toString());
                });
            }
            if (this.backendProcess.stderr) {
                this.backendProcess.stderr.on('data', (data) => {
                    console.log('Backend stderr:', data.toString());
                });
            }
            this.backendProcess.on('exit', (code, signal) => {
                console.log(`Backend process exited with code ${code} and signal ${signal}`);
            });
            // Wait for backend to be ready
            const isReady = await this.waitForBackend(spinner);
            if (isReady) {
                spinner.succeed('Redpill backend started successfully');
                return true;
            }
            else {
                spinner.fail('Backend failed to start within timeout');
                this.stopBackend();
                return false;
            }
        }
        catch (error) {
            spinner.fail(`Error starting backend: ${error instanceof Error ? error.message : error}`);
            return false;
        }
    }
    findProjectRoot(startDir) {
        const cwd = process.cwd();
        // First priority: Check the known project location (MOST RELIABLE)
        const knownProjectPath = '/Users/marvin/redpill-project';
        if ((0, fs_1.existsSync)(knownProjectPath) && this.isRedpillProject(knownProjectPath)) {
            console.log('Found RedPill project at known location:', knownProjectPath);
            return knownProjectPath;
        }
        // Second priority: Check if we're in cli-node, go to parent
        if (cwd.endsWith('/cli-node')) {
            const parentDir = (0, path_1.dirname)(cwd);
            if (this.isRedpillProject(parentDir)) {
                console.log('Found RedPill project parent from cli-node:', parentDir);
                return parentDir;
            }
        }
        // Third priority: Check if we're already in the RedPill project
        if (this.isRedpillProject(cwd)) {
            console.log('Found RedPill project in current directory:', cwd);
            return cwd;
        }
        // Fourth priority: Search upward from current directory
        let currentDir = cwd;
        while (currentDir !== (0, path_1.dirname)(currentDir)) {
            if (this.isRedpillProject(currentDir)) {
                console.log('Found RedPill project by searching upward:', currentDir);
                return currentDir;
            }
            currentDir = (0, path_1.dirname)(currentDir);
        }
        // Fifth priority: Search upward from CLI installation location
        currentDir = startDir;
        while (currentDir !== (0, path_1.dirname)(currentDir)) {
            if (this.isRedpillProject(currentDir)) {
                console.log('Found RedPill project from CLI location:', currentDir);
                return currentDir;
            }
            currentDir = (0, path_1.dirname)(currentDir);
        }
        // Sixth priority: Check common locations
        const commonPaths = [
            (0, path_1.join)(process.env.HOME || '', 'redpill-project'),
            (0, path_1.join)(process.env.HOME || '', 'Projects', 'redpill-project'),
            (0, path_1.join)(process.env.HOME || '', 'Documents', 'redpill-project'),
            (0, path_1.join)(cwd, '..', 'redpill-project'),
            (0, path_1.join)(cwd, 'redpill-project')
        ];
        for (const path of commonPaths) {
            if ((0, fs_1.existsSync)(path) && this.isRedpillProject(path)) {
                console.log('Found RedPill project at common location:', path);
                return path;
            }
        }
        console.log('RedPill project not found. Searched:');
        console.log('- Known location:', knownProjectPath);
        console.log('- Current directory:', cwd);
        console.log('- CLI location upward from:', startDir);
        console.log('- Common paths:', commonPaths);
        return null;
    }
    async getDatabaseUrl(backendDir) {
        // Strategy 1: Try to use the default PostgreSQL connection from config.py
        const defaultPostgres = 'postgresql://marvin@localhost:5432/redpill_db';
        try {
            // Test if we can connect to PostgreSQL by trying to spawn a simple connection test
            const testCmd = 'python3';
            const testScript = `
import sys
sys.path.append('${backendDir}')
try:
    import psycopg2
    conn = psycopg2.connect("${defaultPostgres}")
    conn.close()
    print("postgresql_available")
except Exception as e:
    print(f"postgresql_unavailable: {e}")
`;
            const { spawn } = require('child_process');
            const childProcess = spawn(testCmd, ['-c', testScript], {
                cwd: backendDir,
                stdio: 'pipe',
                env: { ...process.env }
            });
            const output = await new Promise((resolve) => {
                let stdout = '';
                let stderr = '';
                childProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                childProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                childProcess.on('close', () => {
                    console.log('Database test output:', stdout.trim());
                    if (stderr.trim())
                        console.log('Database test errors:', stderr.trim());
                    resolve(stdout.trim());
                });
                childProcess.on('error', (err) => {
                    console.log('Database test spawn error:', err);
                    resolve('');
                });
            });
            if (output.includes('postgresql_available')) {
                console.log('✓ PostgreSQL connection successful - using shared database');
                return defaultPostgres;
            }
            else {
                console.log('PostgreSQL test result:', output);
            }
        }
        catch (error) {
            console.log('PostgreSQL test failed:', error);
        }
        // Strategy 2: Fall back to SQLite for CLI-only mode
        const sqliteUrl = `sqlite:///${backendDir}/cli_mode.db`;
        console.log('⚠ PostgreSQL unavailable - falling back to SQLite (CLI-only data)');
        return sqliteUrl;
    }
    isRedpillProject(dir) {
        try {
            // Primary check: backend directory and main.py (MOST IMPORTANT)
            const backendDir = (0, path_1.join)(dir, 'backend');
            const mainPy = (0, path_1.join)(backendDir, 'app', 'main.py');
            if ((0, fs_1.existsSync)(backendDir) && (0, fs_1.existsSync)(mainPy)) {
                console.log(`✓ RedPill backend structure found in: ${dir}`);
                return true;
            }
            // Secondary check: CLAUDE.md file (unique to RedPill project)
            const claudeMd = (0, path_1.join)(dir, 'CLAUDE.md');
            if ((0, fs_1.existsSync)(claudeMd)) {
                try {
                    const content = require('fs').readFileSync(claudeMd, 'utf8');
                    if (content.includes('RedPill VC CRM') || content.includes('redpill-project')) {
                        console.log(`✓ RedPill CLAUDE.md found in: ${dir}`);
                        return true;
                    }
                }
                catch { }
            }
            // Tertiary check: CLI guide file
            const cliGuide = (0, path_1.join)(dir, 'REDPILL_CLI_GUIDE.md');
            if ((0, fs_1.existsSync)(cliGuide)) {
                console.log(`✓ RedPill CLI guide found in: ${dir}`);
                return true;
            }
            // Last check: cli-node directory structure (but NOT just cli-node itself)
            if ((0, fs_1.existsSync)((0, path_1.join)(dir, 'cli-node')) && (0, fs_1.existsSync)(backendDir)) {
                console.log(`✓ RedPill cli-node structure found in: ${dir}`);
                return true;
            }
            // DON'T check package.json name alone - it causes false positives for cli-node dir
        }
        catch (error) {
            console.log(`Error checking directory ${dir}:`, error);
        }
        return false;
    }
    async findPythonCommand(backendDir) {
        const pythonCommands = ['python3', 'python'];
        for (const cmd of pythonCommands) {
            try {
                const { spawn } = require('child_process');
                const process = spawn(cmd, ['--version'], {
                    cwd: backendDir,
                    stdio: 'pipe'
                });
                const result = await new Promise((resolve) => {
                    process.on('close', (code) => resolve(code === 0));
                    process.on('error', () => resolve(false));
                });
                if (result)
                    return cmd;
            }
            catch { }
        }
        return null;
    }
    async waitForBackend(spinner) {
        const startTime = Date.now();
        while (Date.now() - startTime < this.maxStartupWaitMs) {
            spinner.text = `Waiting for backend to be ready... (${Math.floor((Date.now() - startTime) / 1000)}s)`;
            if (await this.isBackendRunning()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return false;
    }
    stopBackend() {
        if (this.backendProcess) {
            this.backendProcess.kill('SIGTERM');
            this.backendProcess = null;
        }
    }
    // Cleanup on process exit
    setupCleanup() {
        process.on('exit', () => this.stopBackend());
        process.on('SIGINT', () => {
            this.stopBackend();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            this.stopBackend();
            process.exit(0);
        });
    }
}
exports.BackendLauncher = BackendLauncher;
//# sourceMappingURL=backend-launcher.js.map