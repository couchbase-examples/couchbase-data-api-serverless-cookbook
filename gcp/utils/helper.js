import { execSync } from 'child_process';

export function executeCommand(cmd) {
    try {
        const output = execSync(cmd, { encoding: 'utf-8' });
        return output.trim();
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}