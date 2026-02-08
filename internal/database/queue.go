package database

import (
	"database/sql"
	"log"
	"sync"
	"time"
)

// WriteQueue manages a queue of database write operations to prevent concurrent write conflicts
type WriteQueue struct {
	db      *sql.DB
	queue   chan WriteOperation
	wg      sync.WaitGroup
	stopped bool
	mu      sync.Mutex
}

// WriteOperation represents a database write operation
type WriteOperation struct {
	Query  string
	Args   []interface{}
	Result chan WriteResult
}

// WriteResult contains the result of a write operation
type WriteResult struct {
	LastInsertID int64
	RowsAffected int64
	Error        error
}

var writeQueue *WriteQueue
var queueOnce sync.Once

// InitWriteQueue initializes the write queue system
func InitWriteQueue(db *sql.DB) {
	queueOnce.Do(func() {
		writeQueue = &WriteQueue{
			db:    db,
			queue: make(chan WriteOperation, 1000), // Buffer up to 1000 operations
		}
		writeQueue.start()
	})
}

// start begins processing the write queue
func (wq *WriteQueue) start() {
	wq.wg.Add(1)
	go func() {
		defer wq.wg.Done()
		for op := range wq.queue {
			result := WriteResult{}
			
			// Execute the write operation
			res, err := wq.db.Exec(op.Query, op.Args...)
			if err != nil {
				result.Error = err
				log.Printf("WriteQueue error executing query: %v, error: %v", op.Query, err)
			} else {
				result.LastInsertID, _ = res.LastInsertId()
				result.RowsAffected, _ = res.RowsAffected()
			}
			
			// Send result back (non-blocking)
			select {
			case op.Result <- result:
			default:
				// Receiver not waiting, skip
			}
		}
	}()
}

// Enqueue adds a write operation to the queue
func (wq *WriteQueue) Enqueue(query string, args ...interface{}) WriteResult {
	wq.mu.Lock()
	if wq.stopped {
		wq.mu.Unlock()
		return WriteResult{Error: sql.ErrConnDone}
	}
	wq.mu.Unlock()

	resultChan := make(chan WriteResult, 1)
	op := WriteOperation{
		Query:  query,
		Args:   args,
		Result: resultChan,
	}

	// Try to enqueue with timeout
	select {
	case wq.queue <- op:
		// Wait for result with timeout
		select {
		case result := <-resultChan:
			return result
		case <-time.After(5 * time.Second):
			return WriteResult{Error: sql.ErrConnDone}
		}
	case <-time.After(5 * time.Second):
		return WriteResult{Error: sql.ErrConnDone}
	}
}

// EnqueueAsync adds a write operation to the queue without waiting for result
func (wq *WriteQueue) EnqueueAsync(query string, args ...interface{}) {
	wq.mu.Lock()
	if wq.stopped {
		wq.mu.Unlock()
		return
	}
	wq.mu.Unlock()

	resultChan := make(chan WriteResult, 1)
	op := WriteOperation{
		Query:  query,
		Args:   args,
		Result: resultChan,
	}

	select {
	case wq.queue <- op:
	default:
		log.Printf("WriteQueue full, dropping operation: %s", query)
	}
}

// Stop stops the write queue
func (wq *WriteQueue) Stop() {
	wq.mu.Lock()
	wq.stopped = true
	wq.mu.Unlock()
	close(wq.queue)
	wq.wg.Wait()
}

// GetWriteQueue returns the global write queue instance
func GetWriteQueue() *WriteQueue {
	return writeQueue
}
