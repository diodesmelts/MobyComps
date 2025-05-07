/**
 * Simple in-memory ticket locking mechanism to prevent race conditions
 * In a production environment, this should be replaced with a distributed lock
 * system like Redis.
 */

interface TicketLock {
  competitionId: number;
  ticketNumbers: number[];
  timestamp: number;
}

// A map of competition ID to locks
const locks = new Map<string, TicketLock[]>();

// Lock timeout in milliseconds (5 seconds)
const LOCK_TIMEOUT = 5000;

// Generate a lock key for a competition and ticket numbers
function getLockKey(competitionId: number, ticketNumbers: number[]): string {
  return `${competitionId}:${ticketNumbers.join(',')}`;
}

// Clean expired locks
function cleanExpiredLocks() {
  const now = Date.now();
  
  for (const [key, lockList] of locks.entries()) {
    const validLocks = lockList.filter(lock => now - lock.timestamp < LOCK_TIMEOUT);
    
    if (validLocks.length === 0) {
      locks.delete(key);
    } else {
      locks.set(key, validLocks);
    }
  }
}

// Check if tickets are locked
function areTicketsLocked(competitionId: number, ticketNumbers: number[]): boolean {
  cleanExpiredLocks();
  
  // Check for any active locks on these tickets
  for (const lockList of locks.values()) {
    for (const lock of lockList) {
      if (lock.competitionId === competitionId) {
        // Check if any of the requested tickets are in this lock
        for (const number of ticketNumbers) {
          if (lock.ticketNumbers.includes(number)) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

// Lock tickets for atomic operations
export async function lockTickets(competitionId: number, ticketNumbers: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tryLock = () => {
      if (areTicketsLocked(competitionId, ticketNumbers)) {
        // If locked, wait 100ms and try again
        setTimeout(tryLock, 100);
        return;
      }
      
      // Acquire lock
      const key = getLockKey(competitionId, ticketNumbers);
      const lockList = locks.get(key) || [];
      lockList.push({
        competitionId,
        ticketNumbers,
        timestamp: Date.now(),
      });
      locks.set(key, lockList);
      
      resolve();
    };
    
    tryLock();
    
    // Reject after 10 seconds to prevent infinite waiting
    setTimeout(() => {
      reject(new Error("Failed to acquire ticket lock after 10 seconds"));
    }, 10000);
  });
}

// Unlock tickets after operation
export async function unlockTickets(competitionId: number, ticketNumbers: number[]): Promise<void> {
  const key = getLockKey(competitionId, ticketNumbers);
  locks.delete(key);
}
