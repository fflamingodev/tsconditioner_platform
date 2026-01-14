package store

import "sync/atomic"

var nextMemId uint64

func NewMemId() uint64 {
	id := atomic.AddUint64(&nextMemId, 1)
	return id
}
